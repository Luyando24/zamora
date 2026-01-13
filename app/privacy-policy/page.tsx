import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Zamora HMS',
  description: 'Privacy Policy for Zamora Hotel Management System',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl font-bold mb-4 tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="text-slate-500 mb-12 text-lg">Last updated: January 2026</p>

          <div className="space-y-6 text-slate-600">
            <p className="leading-relaxed">
              Welcome to Zamora HMS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect personal information that you voluntarily provide to us when you register on the Application, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Application, or otherwise when you contact us.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-slate-900">Personal Information Provided by You.</strong> We collect names; phone numbers; email addresses; mailing addresses; usernames; passwords; and other similar information.</li>
              <li><strong className="text-slate-900">Payment Data.</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number, and the security code associated with your payment instrument.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use personal information collected via our Application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To post testimonials.</li>
              <li>To request feedback.</li>
              <li>To enable user-to-user communications.</li>
              <li>To manage user accounts.</li>
              <li>To send administrative information to you.</li>
              <li>To protect our Services.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Will Your Information Be Shared With Anyone?</h2>
            <p className="leading-relaxed">
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. How Long Do We Keep Your Information?</h2>
            <p className="leading-relaxed">
              We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. How Do We Keep Your Information Safe?</h2>
            <p className="leading-relaxed">
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Do We Collect Information From Minors?</h2>
            <p className="leading-relaxed">
              We do not knowingly solicit data from or market to children under 18 years of age. By using the Application, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent’s use of the Application.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">7. What Are Your Privacy Rights?</h2>
            <p className="leading-relaxed">
              In some regions (like the European Economic Area), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability. In certain circumstances, you may also have the right to object to the processing of your personal information.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">8. Contact Us</h2>
            <p className="leading-relaxed">
              If you have questions or comments about this policy, you may email us at support@zamoraapp.com.
            </p>
          </div>
        
        <div className="mt-16 pt-8 border-t border-slate-200">
           <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Zamora HMS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
