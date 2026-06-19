// ============================================
// Result Page Component
// File: js/result.js
// ============================================

function ResultPage() {
    const [data, setData] = React.useState(null);
    const [loadingState, setLoadingState] = React.useState('');
    const [error, setError] = React.useState(null);
    const [isConnected, setIsConnected] = React.useState(true);

    const loadData = React.useCallback(async () => {
        setLoadingState('Menghubungkan ke server...');
        setError(null);
        try {
            // 1. Fetch sheet list
            setLoadingState('Mengambil daftar periode...');
            const sheets = await API.fetchSheets();
            
            // Filter alumni sheets (exclude non-alumni sheets)
            const excludeList = ['Tracer 2025', 'Depan', 'Akuntansi-ALL', 'Report', 'Template'];
            const alumniSheets = sheets.filter(name => !excludeList.includes(name));
            
            // 2. Map NIM to Yudisium Date
            const nimToYudisiumDate = {};
            for (let i = 0; i < alumniSheets.length; i++) {
                const sheetName = alumniSheets[i];
                setLoadingState(`Mengambil data alumni: ${sheetName}...`);
                try {
                    const result = await API.fetchData(sheetName);
                    if (result.success && result.data) {
                        result.data.forEach(row => {
                            const nim = String(row['6'] || '').trim(); // key '6' is NIM in alumni sheets
                            if (nim) {
                                nimToYudisiumDate[nim] = sheetName; // Use sheet name as Yudisium date
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Failed to load sheet ${sheetName}:`, err);
                }
            }
            
            // 3. Fetch Tracer study data
            setLoadingState('Mengambil data Tracer 2025...');
            const tracerRes = await API.fetchData('Tracer 2025');
            if (!tracerRes.success) {
                throw new Error(tracerRes.error || 'Gagal memuat Tracer 2025');
            }
            
            const tracerRows = tracerRes.data || [];
            
            // 4. Compile stats
            const totalRespondents = tracerRows.filter(row => String(row['4'] || '').trim() !== '').length; // key '4' is NIM in Tracer Study
            
            const categories = {};
            tracerRows.forEach(row => {
                const nim = String(row['4'] || '').trim();
                if (!nim) return;
                
                const status = String(row['16'] || '').trim() || 'Belum Mengisi'; // key '16' is status in Tracer Study
                const yudisiumDate = nimToYudisiumDate[nim] || 'Lainnya';
                const nama = String(row['5'] || '').trim() || 'Tanpa Nama'; // key '5' is student name
                
                if (!categories[status]) {
                    categories[status] = {
                        name: status,
                        total: 0,
                        yudisiumGroups: {},
                        students: [],
                        yudisiumStudents: {}
                    };
                }
                
                const studentObj = { nim, nama, yudisiumDate };
                
                categories[status].total += 1;
                categories[status].students.push(studentObj);
                
                categories[status].yudisiumGroups[yudisiumDate] = (categories[status].yudisiumGroups[yudisiumDate] || 0) + 1;
                
                if (!categories[status].yudisiumStudents[yudisiumDate]) {
                    categories[status].yudisiumStudents[yudisiumDate] = [];
                }
                categories[status].yudisiumStudents[yudisiumDate].push(studentObj);
            });
            
            setData({
                totalRespondents,
                categories: Object.values(categories)
            });
            setIsConnected(true);
        } catch (err) {
            console.error('Error loading result data:', err);
            setError(err.message || 'Terjadi kesalahan saat memuat data.');
            setIsConnected(false);
        } finally {
            setLoadingState('');
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const getCategoryStyle = (status) => {
        const s = String(status).toLowerCase();
        if (s.includes('bekerja')) {
            return { key: 'bekerja', icon: 'fa-briefcase', label: 'Bekerja' };
        }
        if (s.includes('wiraswasta') || s.includes('wirausaha')) {
            return { key: 'wirausaha', icon: 'fa-store', label: 'Wirausaha' };
        }
        if (s.includes('pendidikan') || s.includes('sekolah') || s.includes('studi')) {
            return { key: 'pendidikan', icon: 'fa-graduation-cap', label: 'Melanjutkan Pendidikan' };
        }
        if (s.includes('mencari kerja')) {
            return { key: 'mencari-kerja', icon: 'fa-user-clock', label: 'Mencari Kerja' };
        }
        return { key: 'default', icon: 'fa-user-tag', label: status || 'Lainnya' };
    };

    const showStudentPopup = (title, students) => {
        if (!students || students.length === 0) return;
        
        Swal.fire({
            title: title,
            html: `
                <div style="text-align: left; max-height: 350px; overflow-y: auto; padding: 10px 5px; font-family: 'Inter', sans-serif;">
                    <p style="font-size: 13px; color: #8892a4; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px;">
                        Jumlah: ${students.length} Mahasiswa
                    </p>
                    <ol style="margin-left: 20px; color: #e0e6ed; line-height: 2;">
                        ${students.map(s => `
                            <li style="margin-bottom: 10px;">
                                <strong style="color: #e0e6ed; font-size: 14px;">${s.nama}</strong>
                                <br/>
                                <span style="font-size: 12px; color: #8892a4; display: inline-flex; align-items: center; gap: 6px; margin-top: 2px;">
                                    <i class="fas fa-id-badge" style="font-size: 11px;"></i> ${s.nim}
                                    <span style="color: rgba(255,255,255,0.15)">·</span>
                                    <i class="fas fa-calendar-alt" style="font-size: 11px;"></i> ${s.yudisiumDate}
                                </span>
                            </li>
                        `).join('')}
                    </ol>
                </div>
            `,
            background: '#16213e',
            color: '#e0e6ed',
            confirmButtonColor: '#6c63ff',
            confirmButtonText: 'Tutup'
        });
    };

    // Filter categories
    const activeCategories = data 
        ? data.categories.filter(cat => !String(cat.name).toLowerCase().includes('mencari kerja'))
        : [];
        
    const searchingCategory = data 
        ? data.categories.find(cat => String(cat.name).toLowerCase().includes('mencari kerja'))
        : null;

    return React.createElement(React.Fragment, null,
        React.createElement('nav', { className: 'navbar' },
            React.createElement('div', { className: 'navbar-left' },
                React.createElement('div', { className: 'navbar-brand' },
                    React.createElement('div', { className: 'navbar-icon' },
                        React.createElement('i', { className: 'fas fa-poll' })
                    ),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'navbar-title' }, 'SAKTI'),
                        React.createElement('div', { className: 'navbar-subtitle' }, 'Hasil Tracer & Evaluasi')
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
                        className: 'nav-link'
                    },
                        React.createElement('i', { className: 'fas fa-chart-line' }),
                        'Monev'
                    ),
                    React.createElement('a', {
                        href: '#result',
                        className: 'nav-link active'
                    },
                        React.createElement('i', { className: 'fas fa-poll' }),
                        'Result'
                    )
                )
            ),
            React.createElement('div', { className: 'navbar-actions' },
                React.createElement('div', { className: `connection-status ${isConnected ? 'online' : 'offline'}` },
                    React.createElement('span', { className: 'dot' }),
                    isConnected ? 'Connected' : 'Offline'
                ),
                React.createElement('button', {
                    className: `btn btn-secondary btn-refresh ${loadingState ? 'loading' : ''}`,
                    onClick: loadData,
                    disabled: !!loadingState,
                    title: 'Refresh Data'
                },
                    React.createElement('i', { className: 'fas fa-sync-alt' })
                )
            )
        ),
        React.createElement('div', { className: 'container' },
            React.createElement('div', { className: 'page-header' },
                React.createElement('div', { className: 'page-header-info' },
                    React.createElement('h1', { className: 'page-title' },
                        React.createElement('i', { className: 'fas fa-poll' }),
                        'Result'
                    ),
                    React.createElement('p', { className: 'page-subtitle' },
                        'Hasil analisis status pekerjaan alumni berdasarkan periode Yudisium'
                    )
                )
            ),

            loadingState
                ? React.createElement('div', { className: 'loading-screen', style: { height: '300px' } },
                    React.createElement('div', { className: 'loading-spinner' }),
                    React.createElement('div', { className: 'loading-text' }, loadingState)
                )
                : error
                    ? React.createElement('div', { className: 'empty-state' },
                        React.createElement('div', { className: 'empty-state-icon' },
                            React.createElement('i', { className: 'fas fa-exclamation-triangle', style: { color: '#ef4444' } })
                        ),
                        React.createElement('div', { className: 'empty-state-title' }, 'Terjadi Kesalahan'),
                        React.createElement('div', { className: 'empty-state-desc' }, error)
                    )
                    : data && React.createElement(React.Fragment, null,
                        
                        // Bagian Pertama: Card Jumlah Responden
                        React.createElement('div', { className: 'stats-grid' },
                            React.createElement('div', { className: 'stat-card', style: { borderLeft: '4px solid var(--accent-primary)' } },
                                React.createElement('div', { className: 'stat-icon purple' },
                                    React.createElement('i', { className: 'fas fa-users-line' })
                                ),
                                React.createElement('div', { className: 'stat-label' }, 'Jumlah Responden'),
                                React.createElement('div', { className: 'stat-value' }, data.totalRespondents),
                                React.createElement('div', { className: 'stat-detail' }, 'Total alumni yang mengisi kuesioner Tracer Study')
                            )
                        ),

                        // Bagian Kedua: Status Alumni Aktif
                        React.createElement('div', { className: 'result-section-title' },
                            React.createElement('i', { className: 'fas fa-user-check' }),
                            'Status Alumni Aktif'
                        ),
                        React.createElement('div', { className: 'result-grid' },
                            activeCategories.length === 0
                                ? React.createElement('div', { className: 'empty-state', style: { gridColumn: '1 / -1' } }, 'Tidak ada data alumni aktif')
                                : activeCategories.map((cat, idx) => {
                                    const styleInfo = getCategoryStyle(cat.name);
                                    return React.createElement('div', { className: 'result-card', key: idx },
                                        React.createElement('div', { className: 'result-card-header' },
                                            React.createElement('div', { className: 'result-card-title-wrap' },
                                                React.createElement('div', { className: `result-card-icon icon-${styleInfo.key}` },
                                                    React.createElement('i', { className: `fas ${styleInfo.icon}` })
                                                ),
                                                React.createElement('div', { className: 'result-card-title' }, cat.name)
                                            ),
                                            React.createElement('span', { 
                                                className: 'result-card-badge clickable-badge',
                                                style: { cursor: 'pointer' },
                                                title: 'Klik untuk melihat daftar nama mahasiswa',
                                                onClick: () => showStudentPopup(cat.name, cat.students)
                                            }, cat.total)
                                        ),
                                        React.createElement('div', { className: 'result-card-body' },
                                            React.createElement('div', { className: 'result-yudisium-title' }, 'Rincian Per Tanggal Yudisium'),
                                            React.createElement('div', { className: 'result-yudisium-list' },
                                                Object.entries(cat.yudisiumGroups)
                                                    .sort((a, b) => a[0].localeCompare(b[0]))
                                                    .map(([date, count]) =>
                                                        React.createElement('div', { className: 'result-yudisium-item', key: date },
                                                            React.createElement('div', { className: 'result-yudisium-date' },
                                                                React.createElement('span', { className: `result-yudisium-dot dot-${styleInfo.key}` }),
                                                                date
                                                            ),
                                                            React.createElement('span', { 
                                                                className: `result-yudisium-count count-${styleInfo.key} clickable-count`,
                                                                style: { cursor: 'pointer' },
                                                                title: 'Klik untuk melihat daftar nama mahasiswa',
                                                                onClick: () => showStudentPopup(`${cat.name} (${date})`, cat.yudisiumStudents[date])
                                                            }, count)
                                                        )
                                                    )
                                            )
                                        )
                                    );
                                })
                        ),

                        // Bagian Ketiga: Tidak Kerja tetapi Sedang Mencari Kerja
                        React.createElement('div', { className: 'result-section-title', style: { borderLeftColor: 'var(--accent-warning)' } },
                            React.createElement('i', { className: 'fas fa-user-clock' }),
                            'Tidak Kerja tetapi Sedang Mencari Kerja'
                        ),
                        React.createElement('div', { className: 'result-grid' },
                            searchingCategory 
                                ? (function() {
                                    const styleInfo = getCategoryStyle(searchingCategory.name);
                                    return React.createElement('div', { className: 'result-card', style: { borderLeft: '3px solid var(--accent-warning)' } },
                                        React.createElement('div', { className: 'result-card-header' },
                                            React.createElement('div', { className: 'result-card-title-wrap' },
                                                React.createElement('div', { className: `result-card-icon icon-${styleInfo.key}` },
                                                    React.createElement('i', { className: `fas ${styleInfo.icon}` })
                                                ),
                                                React.createElement('div', { className: 'result-card-title' }, searchingCategory.name)
                                            ),
                                            React.createElement('span', { 
                                                className: 'result-card-badge clickable-badge',
                                                style: { cursor: 'pointer' },
                                                title: 'Klik untuk melihat daftar nama mahasiswa',
                                                onClick: () => showStudentPopup(searchingCategory.name, searchingCategory.students)
                                            }, searchingCategory.total)
                                        ),
                                        React.createElement('div', { className: 'result-card-body' },
                                            React.createElement('div', { className: 'result-yudisium-title' }, 'Rincian Per Tanggal Yudisium'),
                                            React.createElement('div', { className: 'result-yudisium-list' },
                                                Object.entries(searchingCategory.yudisiumGroups)
                                                    .sort((a, b) => a[0].localeCompare(b[0]))
                                                    .map(([date, count]) =>
                                                        React.createElement('div', { className: 'result-yudisium-item', key: date },
                                                            React.createElement('div', { className: 'result-yudisium-date' },
                                                                React.createElement('span', { className: `result-yudisium-dot dot-${styleInfo.key}` }),
                                                                date
                                                            ),
                                                            React.createElement('span', { 
                                                                className: `result-yudisium-count count-${styleInfo.key} clickable-count`,
                                                                style: { cursor: 'pointer' },
                                                                title: 'Klik untuk melihat daftar nama mahasiswa',
                                                                onClick: () => showStudentPopup(`${searchingCategory.name} (${date})`, searchingCategory.yudisiumStudents[date])
                                                            }, count)
                                                        )
                                                    )
                                            )
                                        )
                                    );
                                })()
                                : React.createElement('div', { className: 'empty-state', style: { gridColumn: '1 / -1' } }, 
                                    React.createElement('div', { className: 'empty-state-icon', style: { fontSize: '32px' } }, 
                                        React.createElement('i', { className: 'fas fa-info-circle' })
                                    ),
                                    React.createElement('div', { className: 'empty-state-title' }, 'Tidak Ada Data'),
                                    React.createElement('div', { className: 'empty-state-desc' }, 'Tidak ditemukan data alumni dengan status "Tidak Kerja tetapi Sedang Mencari Kerja".')
                                )
                        )
                    ),
            
            // Footer
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
        )
    );
}
