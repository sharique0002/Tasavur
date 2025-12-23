import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Contact Page
 * Lavender themed with contact form and info
 */
const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setLoading(false);
    };

    const styles = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #E8DFF5 0%, #C9B8E8 50%, #B8A8D8 100%)',
            padding: '2rem 1rem',
            position: 'relative',
        },
        container: {
            maxWidth: '1100px',
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
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '1.5rem',
        },
        formCard: {
            gridColumn: 'span 7',
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '2.5rem',
            color: 'white',
        },
        infoCard: {
            gridColumn: 'span 5',
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '2.5rem',
            color: 'white',
        },
        title: {
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        },
        subtitle: {
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '2rem',
        },
        inputGroup: {
            marginBottom: '1.5rem',
        },
        label: {
            display: 'block',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.5rem',
        },
        input: {
            width: '100%',
            padding: '1rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.3s',
        },
        textarea: {
            width: '100%',
            padding: '1rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.95rem',
            outline: 'none',
            resize: 'vertical',
            minHeight: '150px',
            fontFamily: 'inherit',
        },
        submitBtn: {
            width: '100%',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, #9B7FCB 0%, #7C5DAF 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
        },
        infoSection: {
            marginBottom: '2rem',
        },
        infoTitle: {
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: '#9B7FCB',
        },
        infoItem: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem',
        },
        infoIcon: {
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(155, 127, 203, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
        },
        infoText: {
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6',
        },
        socialLinks: {
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
        },
        socialIcon: {
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textDecoration: 'none',
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <Link to="/" style={styles.backLink}>
                    ← Back to Home
                </Link>

                <div style={styles.grid}>
                    {/* Contact Form */}
                    <div style={styles.formCard}>
                        <h1 style={styles.title}>
                            <span>💬</span> Get in Touch
                        </h1>
                        <p style={styles.subtitle}>
                            Have a question or want to collaborate? We'd love to hear from you!
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Your Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        style={styles.input}
                                        required
                                        onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        style={styles.input}
                                        required
                                        onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="How can we help?"
                                    style={styles.input}
                                    required
                                    onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Tell us more about your inquiry..."
                                    style={styles.textarea}
                                    required
                                    onFocus={(e) => e.target.style.borderColor = '#9B7FCB'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    ...styles.submitBtn,
                                    opacity: loading ? 0.7 : 1,
                                }}
                                onMouseOver={(e) => {
                                    if (!loading) e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div style={styles.infoCard}>
                        <h2 style={styles.title}>
                            <span>📍</span> Contact Info
                        </h2>
                        <p style={styles.subtitle}>
                            Reach out to us through any of these channels
                        </p>

                        <div style={styles.infoItem}>
                            <div style={styles.infoIcon}>📧</div>
                            <div>
                                <h3 style={styles.infoTitle}>Email</h3>
                                <p style={styles.infoText}>
                                    hello@tasavur.com<br />
                                    support@tasavur.com
                                </p>
                            </div>
                        </div>

                        <div style={styles.infoItem}>
                            <div style={styles.infoIcon}>📞</div>
                            <div>
                                <h3 style={styles.infoTitle}>Phone</h3>
                                <p style={styles.infoText}>
                                    +91 98765 43210<br />
                                    Mon - Fri, 9am - 6pm IST
                                </p>
                            </div>
                        </div>

                        <div style={styles.infoItem}>
                            <div style={styles.infoIcon}>🏢</div>
                            <div>
                                <h3 style={styles.infoTitle}>Office</h3>
                                <p style={styles.infoText}>
                                    Tasavur Innovation Hub<br />
                                    Startup City, Tech Park<br />
                                    Bangalore, India - 560001
                                </p>
                            </div>
                        </div>

                        <div style={styles.infoSection}>
                            <h3 style={styles.infoTitle}>Follow Us</h3>
                            <div style={styles.socialLinks}>
                                <a href="#" style={styles.socialIcon} title="Twitter">🐦</a>
                                <a href="#" style={styles.socialIcon} title="LinkedIn">💼</a>
                                <a href="#" style={styles.socialIcon} title="Instagram">📸</a>
                                <a href="#" style={styles.socialIcon} title="YouTube">▶️</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
