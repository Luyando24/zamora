'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-emerald-600 selection:text-white">
      {/* Header */}
      <nav className="fixed w-full z-50 bg-[#030712]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-black text-xl tracking-[0.2em] uppercase">ZAMORA</span>
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                Get in touch.
              </h1>
              <p className="text-xl text-gray-400 mb-12 max-w-lg">
                Have questions about Zamora? Our team is here to help you modernize your hospitality business.
              </p>

              <div className="space-y-8">
                <ContactInfoItem 
                  icon={<Mail className="w-6 h-6 text-emerald-500" />}
                  title="Email"
                  content="hello@zamoraapp.com"
                  link="mailto:hello@zamoraapp.com"
                />
                <ContactInfoItem 
                  icon={<Phone className="w-6 h-6 text-emerald-500" />}
                  title="Phone"
                  content="+260 970 000 000"
                  link="tel:+260970000000"
                />
                <ContactInfoItem 
                  icon={<MapPin className="w-6 h-6 text-emerald-500" />}
                  title="Office"
                  content="Lusaka, Zambia"
                />
                <ContactInfoItem 
                  icon={<MessageSquare className="w-6 h-6 text-emerald-500" />}
                  title="Support"
                  content="Available 24/7 for Pro members"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 lg:p-12"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
                  <p className="text-gray-400 mb-8">
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-emerald-500 font-bold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Name</label>
                      <input 
                        required
                        type="text" 
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Email</label>
                      <input 
                        required
                        type="email" 
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Subject</label>
                    <select 
                      value={formState.subject}
                      onChange={(e) => setFormState({...formState, subject: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="" className="bg-[#030712]">Select a topic</option>
                      <option value="sales" className="bg-[#030712]">Sales Inquiry</option>
                      <option value="support" className="bg-[#030712]">Technical Support</option>
                      <option value="demo" className="bg-[#030712]">Book a Demo</option>
                      <option value="other" className="bg-[#030712]">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Message</label>
                    <textarea 
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) => setFormState({...formState, message: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                      placeholder="How can we help?"
                    ></textarea>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    {!isSubmitting && <Send className="w-5 h-5" />}
                  </button>
                </form>
              )}
            </motion.div>

          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Zamora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function ContactInfoItem({ icon, title, content, link }: { icon: React.ReactNode, title: string, content: string, link?: string }) {
  const contentEl = link ? (
    <a href={link} className="hover:text-white transition-colors">{content}</a>
  ) : (
    <span>{content}</span>
  );

  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-200">{title}</h3>
        <p className="text-gray-400">{contentEl}</p>
      </div>
    </div>
  );
}
