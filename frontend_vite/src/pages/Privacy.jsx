import { Link } from 'react-router-dom';

/**
 * Privacy Policy Page
 * Lavender themed with professional legal content
 */
const Privacy = () => {
    const styles = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #E8DFF5 0%, #C9B8E8 50%, #B8A8D8 100%)',
            padding: '2rem 1rem',
            position: 'relative',
        },
        container: {
            maxWidth: '900px',
            margin: '0 auto',
        },
        backLink: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#1a1a1a',
            textDecoration: 'none',
            marginBottom: '2rem',
            opacity: 0.7,
            transition: 'opacity 0.3s',
        },
        card: {
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '3rem',
            color: 'white',
        },
        header: {
            marginBottom: '2.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
        title: {
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        },
        subtitle: {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.95rem',
        },
        section: {
            marginBottom: '2rem',
        },
        sectionTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#9B7FCB',
        },
        paragraph: {
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.8',
            marginBottom: '1rem',
        },
        list: {
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.8',
            marginLeft: '1.5rem',
            marginBottom: '1rem',
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <Link to="/" style={styles.backLink}>
                    ← Back to Home
                </Link>

                <div style={styles.card}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>
                            <span>🔒</span> Privacy Policy
                        </h1>
                        <p style={styles.subtitle}>Last updated: December 2024</p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>1. Information We Collect</h2>
                        <p style={styles.paragraph}>
                            At Tasavur, we collect information you provide directly to us, such as when you create an account,
                            submit a startup application, request mentorship, or contact us for support.
                        </p>
                        <ul style={styles.list}>
                            <li>Personal information (name, email address, phone number)</li>
                            <li>Business information (startup details, pitch decks, financial data)</li>
                            <li>Usage data (how you interact with our platform)</li>
                            <li>Communication data (messages, feedback, support requests)</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>2. How We Use Your Information</h2>
                        <p style={styles.paragraph}>
                            We use the information we collect to:
                        </p>
                        <ul style={styles.list}>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Match startups with appropriate mentors and resources</li>
                            <li>Process applications and facilitate connections</li>
                            <li>Send you updates, newsletters, and promotional materials</li>
                            <li>Respond to your comments, questions, and support requests</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>3. Information Sharing</h2>
                        <p style={styles.paragraph}>
                            We do not sell your personal information. We may share your information with:
                        </p>
                        <ul style={styles.list}>
                            <li>Mentors and investors you choose to connect with</li>
                            <li>Service providers who assist in our operations</li>
                            <li>Legal authorities when required by law</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>4. Data Security</h2>
                        <p style={styles.paragraph}>
                            We implement industry-standard security measures to protect your data, including encryption,
                            secure servers, and regular security audits. However, no method of transmission over the
                            Internet is 100% secure.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>5. Your Rights</h2>
                        <p style={styles.paragraph}>
                            You have the right to access, correct, or delete your personal information at any time.
                            Contact us at privacy@tasavur.com to exercise these rights.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>6. Contact Us</h2>
                        <p style={styles.paragraph}>
                            If you have any questions about this Privacy Policy, please contact us at:
                            <br /><br />
                            <strong style={{ color: '#9B7FCB' }}>Email:</strong> privacy@tasavur.com<br />
                            <strong style={{ color: '#9B7FCB' }}>Address:</strong> Tasavur Innovation Hub, Startup City
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
