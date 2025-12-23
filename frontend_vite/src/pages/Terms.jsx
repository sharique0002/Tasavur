import { Link } from 'react-router-dom';

/**
 * Terms of Service Page
 * Lavender themed with professional legal content
 */
const Terms = () => {
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
                            <span>📜</span> Terms of Service
                        </h1>
                        <p style={styles.subtitle}>Last updated: December 2024</p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>1. Acceptance of Terms</h2>
                        <p style={styles.paragraph}>
                            By accessing and using Tasavur's platform, you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our services.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>2. Eligibility</h2>
                        <p style={styles.paragraph}>
                            You must be at least 18 years old and capable of entering into a legally binding agreement
                            to use our services. By using Tasavur, you represent and warrant that you meet these requirements.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>3. User Accounts</h2>
                        <p style={styles.paragraph}>
                            When you create an account with us, you must provide accurate and complete information.
                            You are responsible for:
                        </p>
                        <ul style={styles.list}>
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized access</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>4. Startup Submissions</h2>
                        <p style={styles.paragraph}>
                            By submitting your startup information:
                        </p>
                        <ul style={styles.list}>
                            <li>You confirm all information provided is accurate and truthful</li>
                            <li>You grant Tasavur the right to review and share your submission with mentors and investors</li>
                            <li>You retain all intellectual property rights to your ideas and business</li>
                            <li>Tasavur does not claim ownership of your startup or intellectual property</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>5. Mentorship Services</h2>
                        <p style={styles.paragraph}>
                            Our mentor matching is provided as a facilitation service. Tasavur does not guarantee:
                        </p>
                        <ul style={styles.list}>
                            <li>Specific outcomes from mentorship sessions</li>
                            <li>Availability of any particular mentor</li>
                            <li>Investment or funding from connections made on the platform</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>6. Prohibited Activities</h2>
                        <p style={styles.paragraph}>
                            Users may not:
                        </p>
                        <ul style={styles.list}>
                            <li>Submit false or misleading information</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Use the platform for illegal activities</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Copy or distribute platform content without permission</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>7. Limitation of Liability</h2>
                        <p style={styles.paragraph}>
                            Tasavur shall not be liable for any indirect, incidental, special, consequential, or punitive
                            damages resulting from your use of or inability to use the service.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>8. Changes to Terms</h2>
                        <p style={styles.paragraph}>
                            We reserve the right to modify these terms at any time. We will notify users of significant
                            changes via email or platform notification. Continued use after changes constitutes acceptance.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>9. Contact</h2>
                        <p style={styles.paragraph}>
                            For questions about these Terms, contact us at:
                            <br /><br />
                            <strong style={{ color: '#9B7FCB' }}>Email:</strong> legal@tasavur.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;
