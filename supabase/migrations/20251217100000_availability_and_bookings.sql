-- Function to check room availability for a specific property and date range
-- Returns room_type_ids and their available counts
CREATE OR REPLACE FUNCTION get_room_availability(
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS TABLE (
  room_type_id UUID,
  total_rooms BIGINT,
  booked_rooms BIGINT,
  available_rooms BIGINT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH room_counts AS (
    -- Count total rooms per type
    SELECT 
      r.room_type_id,
      COUNT(*) as total
    FROM rooms r
    WHERE r.property_id = p_property_id
      AND r.status NOT IN ('maintenance') -- Exclude maintenance rooms
    GROUP BY r.room_type_id
  ),
  bookings_counts AS (
    -- Count bookings that overlap with the requested dates
    SELECT 
      r.room_type_id,
      COUNT(*) as booked
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE r.property_id = p_property_id
      AND b.status NOT IN ('cancelled', 'checked_out') -- Exclude cancelled. Checked_out means they left, so room is free? 
                                                       -- If I check for NEXT week, a checked_out booking from LAST week doesn't overlap anyway.
                                                       -- If I check for TODAY, and they checked out TODAY, the room is available (after cleaning).
                                                       -- Overlap logic: (StartA < EndB) and (EndA > StartB).
                                                       -- If Request: Jan 1-2. Booking: Jan 1-2. Overlap? Yes.
                                                       -- If Booking is checked_out (completed stay), it shouldn't block future.
                                                       -- But 'checked_out' status is applied at the END of the stay.
                                                       -- If I am querying for a PAST date, it might matter. For FUTURE, 'checked_out' bookings shouldn't exist (unless time travel).
                                                       -- So 'checked_out' is fine to exclude or include, date logic handles it.
                                                       -- Safer to exclude 'cancelled'.
      AND (b.check_in_date < p_check_out AND b.check_out_date > p_check_in)
    GROUP BY r.room_type_id
  )
  SELECT 
    rc.room_type_id,
    rc.total,
    COALESCE(bc.booked, 0) as booked_rooms,
    (rc.total - COALESCE(bc.booked, 0)) as available_rooms
  FROM room_counts rc
  LEFT JOIN bookings_counts bc ON rc.room_type_id = bc.room_type_id;
END;
$$ LANGUAGE plpgsql;

-- Function for guests to view their own bookings across properties
-- Assumes the user is authenticated and their email matches the guest email
CREATE OR REPLACE FUNCTION get_my_bookings(p_email TEXT)
RETURNS TABLE (
  booking_id UUID,
  property_name TEXT,
  check_in_date DATE,
  check_out_date DATE,
  status TEXT,
  total_amount DECIMAL,
  room_type_name TEXT,
  property_slug TEXT,
  property_cover_image TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    p.name as property_name,
    b.check_in_date,
    b.check_out_date,
    b.status,
    b.total_amount,
    rt.name as room_type_name,
    p.slug as property_slug,
    p.cover_image_url as property_cover_image
  FROM bookings b
  JOIN guests g ON b.guest_id = g.id
  JOIN properties p ON b.property_id = p.id
  LEFT JOIN rooms r ON b.room_id = r.id
  LEFT JOIN room_types rt ON r.room_type_id = rt.id
  WHERE g.email = p_email
  ORDER BY b.check_in_date DESC;
END;
$$ LANGUAGE plpgsql;
