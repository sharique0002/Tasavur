import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startupAPI, handleAPIError } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * StartupDetails Page
 * Displays detailed information about a startup with lavender theme
 */
const StartupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [startup, setStartup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStartup();
    }, [id]);

    const fetchStartup = async () => {
        try {
            setLoading(true);
            const response = await startupAPI.getById(id);
            setStartup(response.data.data);
        } catch (err) {
            console.error('Error fetching startup:', err);
            setError(handleAPIError(err));
        } finally {
            setLoading(false);
        }
    };

    // Styles
    const styles = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #E8DFF5 0%, #C9B8E8 50%, #B8A8D8 100%)',
            padding: '2rem 1rem',
            position: 'relative',
            overflow: 'hidden',
        },
        decorativeCircle1: {
            position: 'absolute',
            width: '500px',
            height: '500px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '50%',
            top: '-10%',
            right: '-5%',
            pointerEvents: 'none',
        },
        decorativeCircle2: {
            position: 'absolute',
            width: '300px',
            height: '300px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '50%',
            bottom: '10%',
            left: '-5%',
            pointerEvents: 'none',
        },
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
        },
        backButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#1a1a1a',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            marginBottom: '1.5rem',
            opacity: 0.7,
            transition: 'opacity 0.3s',
        },
        bentoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '1rem',
        },
        heroCard: {
            gridColumn: 'span 8',
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '2.5rem',
            color: 'white',
        },
        sideCard: {
            gridColumn: 'span 4',
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '2rem',
            color: 'white',
        },
        statusBadge: {
            display: 'inline-block',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '500',
            marginBottom: '1rem',
        },
        startupName: {
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
            lineHeight: '1.2',
        },
        tagline: {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            marginBottom: '1.5rem',
        },
        metaRow: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
        },
        metaItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.8)',
        },
        tagsContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
        },
        tag: {
            padding: '0.5rem 1rem',
            background: 'rgba(155, 127, 203, 0.2)',
            borderRadius: '20px',
            fontSize: '0.85rem',
            color: '#9B7FCB',
        },
        sectionTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        statNumber: {
            fontSize: '2.5rem',
            fontWeight: '300',
            color: '#9B7FCB',
            lineHeight: '1',
        },
        statLabel: {
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '0.5rem',
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem',
            marginTop: '1.5rem',
        },
        statCard: {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'center',
        },
        fullCard: {
            gridColumn: 'span 12',
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '2rem',
            color: 'white',
        },
        founderCard: {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        founderAvatar: {
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9B7FCB 0%, #7C5DAF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'white',
        },
        founderInfo: {
            flex: 1,
        },
        founderName: {
            fontWeight: '600',
            marginBottom: '0.25rem',
        },
        founderRole: {
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
        },
        actionButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: 'none',
            textDecoration: 'none',
        },
        primaryBtn: {
            background: 'linear-gradient(135deg, #9B7FCB 0%, #7C5DAF 100%)',
            color: 'white',
        },
        secondaryBtn: {
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        contactCard: {
            gridColumn: 'span 6',
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '2rem',
            color: 'white',
        },
        contactItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
        contactIcon: {
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(155, 127, 203, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
        },
        loadingContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
        },
        spinner: {
            width: '48px',
            height: '48px',
            border: '4px solid rgba(155, 127, 203, 0.3)',
            borderTopColor: '#9B7FCB',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        },
        errorCard: {
            gridColumn: 'span 12',
            background: '#1a1a1a',
            borderRadius: '24px',
            padding: '3rem',
            color: 'white',
            textAlign: 'center',
        },
    };

    const getStatusStyle = (status) => {
        const colors = {
            Pending: { bg: 'rgba(234, 179, 8, 0.2)', color: '#EAB308' },
            Approved: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' },
            Active: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' },
            Rejected: { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' },
        };
        return colors[status] || { bg: 'rgba(255, 255, 255, 0.1)', color: 'white' };
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !startup) {
        return (
            <div style={styles.page}>
                <div style={styles.decorativeCircle1}></div>
                <div style={styles.decorativeCircle2}></div>
                <div style={styles.container}>
                    <Link to="/dashboard" style={styles.backButton}>
                        ← Back to Dashboard
                    </Link>
                    <div style={styles.bentoGrid}>
                        <div style={styles.errorCard}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                Startup Not Found
                            </h2>
                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
                                {error || "We couldn't find the startup you're looking for."}
                            </p>
                            <Link to="/dashboard" style={{ ...styles.actionButton, ...styles.primaryBtn }}>
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statusStyle = getStatusStyle(startup.status);

    return (
        <div style={styles.page}>
            <div style={styles.decorativeCircle1}></div>
            <div style={styles.decorativeCircle2}></div>

            <div style={styles.container}>
                <Link
                    to="/dashboard"
                    style={styles.backButton}
                    onMouseOver={(e) => e.target.style.opacity = 1}
                    onMouseOut={(e) => e.target.style.opacity = 0.7}
                >
                    ← Back to Dashboard
                </Link>

                <div style={styles.bentoGrid}>
                    {/* Hero Card */}
                    <div style={styles.heroCard}>
                        <span style={{
                            ...styles.statusBadge,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                        }}>
                            {startup.status}
                        </span>
                        <h1 style={styles.startupName}>{startup.name}</h1>
                        <p style={styles.tagline}>{startup.shortDesc}</p>

                        <div style={styles.metaRow}>
                            <div style={styles.metaItem}>
                                <span>🎯</span>
                                <span>{startup.domain}</span>
                            </div>
                            <div style={styles.metaItem}>
                                <span>📊</span>
                                <span>{startup.stage}</span>
                            </div>
                            {startup.website && (
                                <a
                                    href={startup.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ ...styles.metaItem, textDecoration: 'none', color: '#9B7FCB' }}
                                >
                                    <span>🌐</span>
                                    <span>Website</span>
                                </a>
                            )}
                        </div>

                        {startup.tags && startup.tags.length > 0 && (
                            <div style={styles.tagsContainer}>
                                {startup.tags.map((tag, index) => (
                                    <span key={index} style={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats Side Card */}
                    <div style={styles.sideCard}>
                        <h3 style={styles.sectionTitle}>
                            <span>📈</span> Key Metrics
                        </h3>
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>
                                    ${((startup.kpis?.revenue || 0) / 1000).toFixed(0)}k
                                </div>
                                <div style={styles.statLabel}>Revenue</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>
                                    {(startup.kpis?.users || 0).toLocaleString()}
                                </div>
                                <div style={styles.statLabel}>Users</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{ ...styles.statNumber, color: startup.kpis?.growth >= 0 ? '#22C55E' : '#EF4444' }}>
                                    {startup.kpis?.growth >= 0 ? '+' : ''}{startup.kpis?.growth || 0}%
                                </div>
                                <div style={styles.statLabel}>Growth</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>
                                    ${((startup.kpis?.funding || 0) / 1000).toFixed(0)}k
                                </div>
                                <div style={styles.statLabel}>Funding</div>
                            </div>
                        </div>
                    </div>

                    {/* Founders Card */}
                    <div style={styles.contactCard}>
                        <h3 style={styles.sectionTitle}>
                            <span>👥</span> Founders
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {startup.founders && startup.founders.map((founder, index) => (
                                <div key={index} style={styles.founderCard}>
                                    <div style={styles.founderAvatar}>
                                        {founder.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={styles.founderInfo}>
                                        <div style={styles.founderName}>{founder.name}</div>
                                        <div style={styles.founderRole}>{founder.role}</div>
                                    </div>
                                    {founder.email && (
                                        <a
                                            href={`mailto:${founder.email}`}
                                            style={{ color: '#9B7FCB', fontSize: '1.25rem' }}
                                        >
                                            ✉️
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Card */}
                    <div style={styles.contactCard}>
                        <h3 style={styles.sectionTitle}>
                            <span>📞</span> Contact Information
                        </h3>
                        <div>
                            {startup.contact?.email && (
                                <div style={styles.contactItem}>
                                    <div style={styles.contactIcon}>✉️</div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>Email</div>
                                        <a href={`mailto:${startup.contact.email}`} style={{ color: 'white', textDecoration: 'none' }}>
                                            {startup.contact.email}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {startup.contact?.phone && (
                                <div style={{ ...styles.contactItem, borderBottom: 'none' }}>
                                    <div style={styles.contactIcon}>📱</div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>Phone</div>
                                        <a href={`tel:${startup.contact.phone}`} style={{ color: 'white', textDecoration: 'none' }}>
                                            {startup.contact.phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div style={styles.fullCard}>
                        <h3 style={styles.sectionTitle}>
                            <span>🚀</span> Quick Actions
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            {isAuthenticated && user?.role === 'founder' && (
                                <Link
                                    to={`/funding?startup=${startup._id}`}
                                    style={{ ...styles.actionButton, ...styles.primaryBtn }}
                                >
                                    💰 Apply for Funding
                                </Link>
                            )}
                            {isAuthenticated && user?.role === 'founder' && (
                                <Link
                                    to={`/mentor-request?startup=${startup._id}`}
                                    style={{ ...styles.actionButton, ...styles.secondaryBtn }}
                                >
                                    🤝 Request Mentorship
                                </Link>
                            )}
                            {startup.pitchDeck && (
                                <a
                                    href={startup.pitchDeck}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ ...styles.actionButton, ...styles.secondaryBtn }}
                                >
                                    📄 View Pitch Deck
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default StartupDetails;
