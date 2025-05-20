import { Link } from "react-router";

function PrivacyPolicyView() {
  return (
    <main className="min-h-screen bg-base-200 p-6">
      <div className="max-w-3xl mx-auto shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="mb-4">
          Your privacy is important to us. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you visit our website.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
        <ul className="list-disc list-inside mb-4">
          <li><strong>Personal Data:</strong> Name, email address, and any other information you provide during registration.</li>
          <li><strong>Usage Data:</strong> Pages visited, time spent on pages, and other browsing activity.</li>
          <li><strong>Device Information:</strong> IP address, browser type, and operating system.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
        <ul className="list-disc list-inside mb-4">
          <li>To provide, maintain, and improve our services.</li>
          <li>To authenticate users and manage accounts.</li>
          <li>To send you updates, notices, and promotional materials (with your consent).</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">3. Cookies and Tracking Technologies</h2>
        <p className="mb-4">
          We use cookies and similar technologies to enhance your experience. You can set your browser to refuse cookies, but some features may not function properly.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">4. Third-Party Services</h2>
        <p className="mb-4">
          We may share information with trusted third-party service providers to perform functions such as payment processing, analytics, and hosting. These providers have their own privacy policies.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">5. Security of Your Information</h2>
        <p className="mb-4">
          We implement reasonable security measures to protect your information, but no system is completely secure. Use caution when sharing personal information online.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">6. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy periodically. The date at the top will reflect the latest revision. Please review this policy regularly.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">7. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us at{' '}
          <a href="mailto:support@example.com" className="text-primary underline">support@example.com</a>.
        </p>

        <div className="mt-8 text-center pb-6">
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    </main>
  );
}

export default PrivacyPolicyView;