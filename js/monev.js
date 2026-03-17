// ============================================
// Monev Page Component
// ============================================

function MonevPage() {
    const [periods, setPeriods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadMonevData();
    }, []);

    const loadMonevData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch data from "Depan" sheet
            const resDepan = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=read&sheet=${encodeURIComponent('Depan')}`);
            if (!resDepan.ok) throw new Error('Network error');
            const jsonDepan = await resDepan.json();
            if (!jsonDepan.success) {
                // If the sheet hasn't been created yet or empty, just show empty
                if (jsonDepan.error && jsonDepan.error.includes('not found')) {
                    setPeriods([]);
                    setIsLoading(false);
                    return;
                }
                throw new Error(jsonDepan.error || 'Failed to fetch Depan data');
            }

            const rawPeriods = jsonDepan.data || [];
            
            // 2. Map data based on columns: A (1) = Periode; B (2) = Jumlah Lulusan; C (3) = PIC
            const periodeData = rawPeriods.map(row => ({
                periode: row['1'] || '-',
                jumlahLulusan: parseInt(row['2']) || 0,
                pic: row['3'] || '-',
                filled: null // Initial state is null to show skeleton animation
            })).filter(p => p.periode !== '-'); // Filter empty rows

            // Mount the cards with skeleton state
            setPeriods(periodeData);
            setIsLoading(false);

            // 3. Fetch Tracer Study Data once
            let tracerNIMs = [];
            try {
                const resTracer = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=read&sheet=${encodeURIComponent(CONFIG.TRACER_STUDY_SHEET)}`);
                const jsonTracer = await resTracer.json();
                if (jsonTracer.success && jsonTracer.data) {
                    // Extract NIMs from Tracer Study (col 4)
                    tracerNIMs = jsonTracer.data.map(row => String(row['4'] || '').trim());
                }
            } catch (e) {
                console.error('Error fetching Tracer Study sheet', e);
                // Can continue without crashing entirely, but filled counts will be 0
            }

            // 4. Construct concurrent requests to get filled rows for each period
            const updatedPeriods = await Promise.all(periodeData.map(async (p) => {
                try {
                    const resSheet = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=read&sheet=${encodeURIComponent(p.periode)}`);
                    const jsonSheet = await resSheet.json();
                    if (jsonSheet.success && jsonSheet.data) {
                        // Count how many alumni in this period have their NIM in the Tracer Study list
                        const filledCount = jsonSheet.data.filter(row => {
                            const nim = String(row['6'] || '').trim();
                            return nim && tracerNIMs.includes(nim);
                        }).length;
                        return { ...p, filled: filledCount };
                    }
                    return { ...p, filled: 0 };
                } catch (e) {
                    console.error('Error fetching sheet', p.periode, e);
                    return { ...p, filled: 0 }; // Set to 0 on error, remove skeleton
                }
            }));

            setPeriods(updatedPeriods);

        } catch (error) {
            console.error('Load monev error:', error);
            setError(error.message);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    return React.createElement(React.Fragment, null,
        React.createElement('nav', { className: 'navbar' },
            React.createElement('div', { className: 'navbar-left' },
                React.createElement('div', { className: 'navbar-brand' },
                    React.createElement('div', { className: 'navbar-icon' },
                        React.createElement('i', { className: 'fas fa-chart-pie' })
                    ),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'navbar-title' }, 'SAKTI'),
                        React.createElement('div', { className: 'navbar-subtitle' }, 'Monitoring & Evaluasi')
                    )
                ),
                React.createElement('div', { className: 'navbar-nav' },
                    React.createElement('a', {
                        href: '#home',
                        className: 'nav-link'
                    },
                        React.createElement('i', { className: 'fas fa-th-large' }),
                        'Dashboard'
                    ),
                    React.createElement('a', {
                        href: '#tracer-study',
                        className: 'nav-link'
                    },
                        React.createElement('i', { className: 'fas fa-clipboard-list' }),
                        'Tracer Study'
                    ),
                    React.createElement('a', {
                        href: '#monev',
                        className: 'nav-link active'
                    },
                        React.createElement('i', { className: 'fas fa-chart-line' }),
                        'Monev'
                    )
                )
            ),
            React.createElement('div', { className: 'navbar-actions' },
                React.createElement('button', {
                    className: `btn btn-secondary btn-refresh ${isLoading ? 'loading' : ''}`,
                    onClick: loadMonevData,
                    disabled: isLoading,
                    title: 'Refresh Data'
                },
                    React.createElement('i', { className: 'fas fa-sync-alt' })
                )
            )
        ),
        React.createElement('div', { className: 'container tracer-container' },
            React.createElement('div', { className: 'tracer-header' },
                React.createElement('div', null,
                    React.createElement('h1', { className: 'tracer-title' }, 'Monitoring Hasil Tracer'),
                    React.createElement('p', { className: 'tracer-subtitle' }, 'Statistik pengisian form per periode')
                )
            ),
            
            isLoading 
                ? React.createElement('div', { className: 'loading-screen', style: { height: '300px' } },
                    React.createElement('div', { className: 'loading-spinner' }),
                    React.createElement('div', { className: 'loading-text' }, 'Memuat data Monev...')
                )
                : error 
                    ? React.createElement('div', { className: 'empty-state' },
                        React.createElement('div', { className: 'empty-state-icon' },
                            React.createElement('i', { className: 'fas fa-exclamation-triangle', style: {color: '#ef4444'} })
                        ),
                        React.createElement('div', { className: 'empty-state-title' }, 'Terjadi Kesalahan'),
                        React.createElement('div', { className: 'empty-state-desc' }, error)
                    )
                    : periods.length === 0
                        ? React.createElement('div', { className: 'empty-state' },
                            React.createElement('div', { className: 'empty-state-icon' },
                                React.createElement('i', { className: 'fas fa-folder-open' })
                            ),
                            React.createElement('div', { className: 'empty-state-title' }, 'Belum ada data periode'),
                            React.createElement('div', { className: 'empty-state-desc' }, 'Pastikan "Sheet Depan" telah diisi.')
                        )
                        : React.createElement(React.Fragment, null,
                            (function() {
                                const totalTarget = periods.reduce((sum, p) => sum + p.jumlahLulusan, 0);
                                const isTotalLoading = periods.some(p => p.filled === null);
                                const totalFilled = isTotalLoading ? 0 : periods.reduce((sum, p) => sum + p.filled, 0);
                                const totalPct = isTotalLoading ? 0 : (totalTarget > 0 ? Math.min(100, Math.round((totalFilled / totalTarget) * 100)) : 0);
                                
                                return React.createElement('div', { className: 'monev-grid', style: { marginBottom: '20px' } },
                                    React.createElement('div', { className: 'monev-card monev-card-total' },
                                        React.createElement('div', { className: 'monev-card-header' },
                                            React.createElement('div', { className: 'monev-period-title' },
                                                React.createElement('i', { className: 'fas fa-calendar-alt' }),
                                                'Total'
                                            ),
                                            React.createElement('div', { className: 'monev-pic-badge', style: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' } }, 
                                                React.createElement('i', { className: 'fas fa-user-tie' }),
                                                'Sekjur'
                                            )
                                        ),
                                        React.createElement('div', { className: 'monev-card-body' },
                                            React.createElement('div', { className: 'monev-stat-row' },
                                                React.createElement('span', { className: 'monev-stat-label' }, 'Total Target Lulusan'),
                                                React.createElement('span', { className: 'monev-stat-value' }, totalTarget)
                                            ),
                                            React.createElement('div', { className: 'monev-stat-row' },
                                                React.createElement('span', { className: 'monev-stat-label' }, 'Total Sudah Mengisi'),
                                                isTotalLoading
                                                    ? React.createElement('div', { className: 'skeleton-box', style: { width: '40px', height: '28px', borderRadius: '4px' } })
                                                    : React.createElement('span', { className: 'monev-stat-value' }, totalFilled)
                                            ),
                                            React.createElement('div', { className: 'monev-progress-container' },
                                                React.createElement('div', { className: 'monev-progress-header' },
                                                    React.createElement('span', null, 'Progress Keseluruhan'),
                                                    isTotalLoading
                                                        ? React.createElement('div', { className: 'skeleton-box', style: { width: '30px', height: '18px', borderRadius: '4px' } })
                                                        : React.createElement('span', { className: 'monev-progress-text' }, `${totalPct}%`)
                                                ),
                                                React.createElement('div', { className: `monev-progress-bar ${isTotalLoading ? 'skeleton-box' : ''}` },
                                                    !isTotalLoading && React.createElement('div', { 
                                                        className: 'monev-progress-fill', 
                                                        style: { width: `${totalPct}%`, backgroundColor: totalPct >= 100 ? '#10b981' : totalPct >= 50 ? '#3b82f6' : '#f59e0b' }
                                                    })
                                                )
                                            )
                                        )
                                    )
                                );
                            })(),
                            React.createElement('div', { className: 'monev-grid' },
                            periods.map((p, idx) => {
                                const isLoadingValue = p.filled === null;
                                const progressPct = !isLoadingValue && p.jumlahLulusan > 0 
                                    ? Math.min(100, Math.round((p.filled / p.jumlahLulusan) * 100))
                                    : 0;
                                
                                return React.createElement('div', { className: 'monev-card', key: idx },
                                    React.createElement('div', { className: 'monev-card-header' },
                                        React.createElement('div', { className: 'monev-period-title' },
                                            React.createElement('i', { className: 'fas fa-calendar-alt' }),
                                            p.periode
                                        ),
                                        React.createElement('div', { className: 'monev-pic-badge' }, 
                                            React.createElement('i', { className: 'fas fa-user-tie' }),
                                            p.pic
                                        )
                                    ),
                                    React.createElement('div', { className: 'monev-card-body' },
                                        React.createElement('div', { className: 'monev-stat-row' },
                                            React.createElement('span', { className: 'monev-stat-label' }, 'Target Lulusan'),
                                            React.createElement('span', { className: 'monev-stat-value' }, p.jumlahLulusan)
                                        ),
                                        React.createElement('div', { className: 'monev-stat-row' },
                                            React.createElement('span', { className: 'monev-stat-label' }, 'Sudah Mengisi'),
                                            isLoadingValue
                                                ? React.createElement('div', { className: 'skeleton-box', style: { width: '30px', height: '28px', borderRadius: '4px' } })
                                                : React.createElement('span', { className: 'monev-stat-value' }, p.filled)
                                        ),
                                        React.createElement('div', { className: 'monev-progress-container' },
                                            React.createElement('div', { className: 'monev-progress-header' },
                                                React.createElement('span', null, 'Progress Pengisian'),
                                                isLoadingValue
                                                    ? React.createElement('div', { className: 'skeleton-box', style: { width: '30px', height: '18px', borderRadius: '4px' } })
                                                    : React.createElement('span', { className: 'monev-progress-text' }, `${progressPct}%`)
                                            ),
                                            React.createElement('div', { className: `monev-progress-bar ${isLoadingValue ? 'skeleton-box' : ''}` },
                                                !isLoadingValue && React.createElement('div', { 
                                                    className: 'monev-progress-fill', 
                                                    style: { width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? '#10b981' : progressPct >= 50 ? '#3b82f6' : '#f59e0b' }
                                                })
                                            )
                                        )
                                    )
                                );
                            })
                            )
                        )
        ),
        React.createElement('footer', { className: 'app-footer' },
            React.createElement('p', null,
                'Copyright 2026 ',
                React.createElement('a', {
                    href: 'https://instagram.com/madenp_',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'footer-link'
                }, '@madenp_')
            )
        )
    );
}
