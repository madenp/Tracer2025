// ============================================
// Tracer Study Page Component
// File: js/tracerStudy.js
//
// Mechanism:
// 1. User selects an alumni sheet (e.g. "3 Januari 2025")
// 2. Fetch col 2 (Nama) & col 6 (NIM) from that sheet
// 3. Fetch col D (col 4) from "Tracer 2025" sheet
// 4. Match NIM from alumni sheet with col D of Tracer 2025
// 5. Display cards showing match status
// ============================================

const { useState: tsUseState, useEffect: tsUseEffect, useCallback: tsUseCallback, useMemo: tsUseMemo, useRef: tsUseRef } = React;

function TracerSkeletonCard() {
    return React.createElement('div', { className: 'tracer-card skeleton-card' },
        React.createElement('div', { className: 'tracer-card-header' },
            React.createElement('div', { className: 'tracer-card-avatar skeleton-avatar shimmer' }),
            React.createElement('div', { className: 'skeleton-badge shimmer' })
        ),
        React.createElement('div', { className: 'tracer-card-body' },
            React.createElement('div', { className: 'skeleton-text shimmer', style: { width: '80%', height: '18px', marginBottom: '8px', borderRadius: '4px' } }),
            React.createElement('div', { className: 'skeleton-text shimmer', style: { width: '40%', height: '14px', borderRadius: '4px' } }),
            React.createElement('div', { className: 'tracer-card-actions', style: { marginTop: '12px' } },
                React.createElement('div', { className: 'skeleton-button shimmer', style: { width: '110px', height: '32px', borderRadius: '6px' } }),
                React.createElement('div', { className: 'skeleton-button shimmer', style: { width: '120px', height: '32px', borderRadius: '6px' } })
            )
        )
    );
}

// ============================================
// Tracer Study Page (Main Component)
// ============================================
function TracerStudyPage() {
    const [alumni, setAlumni] = tsUseState([]);
    const [tracerNIMs, setTracerNIMs] = tsUseState([]);
    const [reportData, setReportData] = tsUseState({});
    const [sheets, setSheets] = tsUseState([]);
    const [selectedSheet, setSelectedSheet] = tsUseState(CONFIG.DEFAULT_SHEET);
    const [isLoading, setIsLoading] = tsUseState(true);
    const [isConnected, setIsConnected] = tsUseState(false);
    const [loadingStatus, setLoadingStatus] = tsUseState('Offline');
    const [searchQuery, setSearchQuery] = tsUseState('');
    const [filterStatus, setFilterStatus] = tsUseState('all'); // 'all', 'filled', 'not-filled'
    const [toasts, setToasts] = tsUseState([]);

    const toastIdRef = tsUseRef(0);
    const tracerSheet = CONFIG.TRACER_STUDY_SHEET;

    const addToast = tsUseCallback((message, type = 'success') => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = tsUseCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Load sheet list
    const loadSheets = tsUseCallback(async () => {
        try {
            const sheetList = await API.fetchSheets();
            // Exclude tracer sheet, "Depan", and "Akuntansi-ALL" from the selector
            const excludeList = [tracerSheet, 'Depan', 'Akuntansi-ALL'];
            const filtered = sheetList.filter(s => !excludeList.includes(s));
            setSheets(filtered);
            
            // If the currently selected sheet is one of the excluded ones, default to the first available
            if (filtered.length > 0 && excludeList.includes(selectedSheet)) {
                setSelectedSheet(filtered[0]);
            }
        } catch (error) {
            console.error('Load sheets error:', error);
        }
    }, [tracerSheet, selectedSheet]);

    // Load data from both sheets
    const loadData = tsUseCallback(async (sheet) => {
        setIsLoading(true);
        setIsConnected(false);
        setLoadingStatus('Mengambil data Alumni...');
        
        try {
            // Fetch alumni data from selected sheet
            const alumniResult = await API.fetchData(sheet || selectedSheet);
            const alumniData = (alumniResult.data || []).map(row => ({
                nama: row['2'] || '-',
                nim: String(row['6'] || '').trim(),
                waLink: row['16'] || '', // Kolom P
                _rowIndex: row._rowIndex
            }));
            setAlumni(alumniData);

            // Fetch tracer study data
            setLoadingStatus('Mencocokan Tracer Study...');
            try {
                const tracerResult = await API.fetchData(tracerSheet);
                const tracerData = (tracerResult.data || []).map(row => String(row['4'] || '').trim());
                setTracerNIMs(tracerData);
            } catch (tracerErr) {
                console.error('Tracer sheet error:', tracerErr);
                setTracerNIMs([]);
                addToast('Sheet "' + tracerSheet + '" belum ditemukan. Pastikan sheet sudah dibuat.', 'warning');
            }

            // Fetch Report data
            setLoadingStatus('Mengambil data Report...');
            try {
                const reportResult = await API.fetchData('Report');
                const reportDict = {};
                if (reportResult.data) {
                    reportResult.data.forEach(row => {
                        const nim = String(row['2'] || '').trim();
                        const masalah = row['3'] || '';
                        if (nim && masalah) {
                            reportDict[nim] = masalah;
                        }
                    });
                }
                setReportData(reportDict);
            } catch (reportErr) {
                console.error('Report sheet error:', reportErr);
                setReportData({});
            }

            setIsConnected(true);
            setLoadingStatus('Connected');
        } catch (error) {
            console.error('Load data error:', error);
            setIsConnected(false);
            setLoadingStatus('Offline');
            addToast('Gagal memuat data: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedSheet, tracerSheet]);

    tsUseEffect(() => {
        loadSheets();
    }, []);

    tsUseEffect(() => {
        loadData(selectedSheet);
    }, [selectedSheet]);

    const handleSheetChange = (sheet) => {
        setSelectedSheet(sheet);
        setSearchQuery('');
        setFilterStatus('all');
    };

    const handleRefresh = () => {
        loadData(selectedSheet);
        addToast('Data berhasil dimuat ulang', 'success');
    };

    const handleCopyWA = (waLink) => {
        navigator.clipboard.writeText(waLink).then(() => {
            addToast('Link WA berhasil disalin!', 'success');
        }).catch(err => {
            console.error('Failed to copy WA link:', err);
            addToast('Gagal menyalin link WA', 'error');
        });
    };

    const formatWANumber = (link) => {
        if (!link) return '';
        // Extract number from https://wa.me/628...
        const match = link.match(/wa\.me\/([0-9]+)/);
        if (match && match[1]) {
            return match[1];
        }
        return 'Hubungi';
    };

    const handleReportMasalah = async (alumniData) => {
        const { value: masalah } = await Swal.fire({
            title: 'Report Masalah',
            input: 'select',
            inputOptions: {
                'No WA Salah': 'No WA Salah',
                'Belum Ada No WA': 'Belum Ada No WA',
                'Belum Kerja': 'Belum Kerja',
                'Lainnya': 'Lainnya'
            },
            inputPlaceholder: 'Pilih Masalah',
            showCancelButton: true,
            confirmButtonText: 'Kirim',
            cancelButtonText: 'Batal'
        });

        if (masalah) {
            setIsLoading(true);
            try {
                await API.createRow('Report', { nim: alumniData.nim, masalah: masalah });
                addToast('Report berhasil dikirim', 'success');
                // Refresh data to show latest report state
                await loadData(selectedSheet);
            } catch (error) {
                console.error('Report error:', error);
                addToast('Gagal mengirim report: ' + error.message, 'error');
                setIsLoading(false); // only needed if loadData wasn't called
            }
        }
    };

    // Cross-reference: build alumni list with tracer status
    const alumniWithStatus = tsUseMemo(() => {
        return alumni.map(a => ({
            ...a,
            filled: a.nim && tracerNIMs.includes(a.nim),
            masalah: reportData[a.nim] || null
        }));
    }, [alumni, tracerNIMs, reportData]);

    // Stats
    const stats = tsUseMemo(() => {
        const total = alumniWithStatus.length;
        const filled = alumniWithStatus.filter(a => a.filled).length;
        const notFilled = total - filled;
        
        // Calculate new stats based on the masalah property
        const waBermasalah = alumniWithStatus.filter(a => 
            a.masalah === 'No WA Salah' || a.masalah === 'Belum Ada No WA'
        ).length;
        
        const belumKerja = alumniWithStatus.filter(a => 
            a.masalah === 'Belum Kerja'
        ).length;

        // Calculate percentages
        const pct = total > 0 ? Math.round(filled / total * 100) : 0;
        const pctWA = total > 0 ? Math.round(waBermasalah / total * 100) : 0;
        const pctKerja = total > 0 ? Math.round(belumKerja / total * 100) : 0;
        const pctTotalResponse = pct + pctWA + pctKerja;

        return { total, filled, notFilled, pct, waBermasalah, belumKerja, pctWA, pctKerja, pctTotalResponse };
    }, [alumniWithStatus]);

    // Filter & Search
    const filteredAlumni = tsUseMemo(() => {
        let list = alumniWithStatus;

        // Filter by status
        if (filterStatus === 'filled') list = list.filter(a => a.filled);
        if (filterStatus === 'not-filled') list = list.filter(a => !a.filled);

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(a =>
                a.nama.toLowerCase().includes(q) || a.nim.toLowerCase().includes(q)
            );
        }

        return list;
    }, [alumniWithStatus, filterStatus, searchQuery]);

    // ============================================
    // Render
    // ============================================
    return React.createElement(React.Fragment, null,
        React.createElement(Navbar, {
            currentSheet: selectedSheet,
            sheets: sheets,
            onSheetChange: handleSheetChange,
            onRefresh: handleRefresh,
            isLoading: isLoading,
            isConnected: isConnected,
            currentPage: '#tracer-study',
            loadingText: loadingStatus
        }),
        React.createElement(Toast, { toasts, onRemove: removeToast }),
        React.createElement('div', { className: 'container' },

            // Page header
            React.createElement('div', { className: 'page-header' },
                React.createElement('div', { className: 'page-header-info' },
                    React.createElement('h1', { className: 'page-title' },
                        React.createElement('i', { className: 'fas fa-clipboard-list' }),
                        'Tracer Study'
                    ),
                    React.createElement('p', { className: 'page-subtitle' },
                        'Penelusuran status pengisian tracer study alumni'
                    )
                )
            ),

            // Stats cards
            React.createElement('div', { className: 'stats-grid' },
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon purple' },
                        React.createElement('i', { className: 'fas fa-users' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Total Alumni'),
                    React.createElement('div', { className: 'stat-value' }, stats.total),
                    React.createElement('div', { className: 'stat-detail' }, 'Data dari sheet "' + selectedSheet + '"')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon green' },
                        React.createElement('i', { className: 'fas fa-check-circle' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Sudah Mengisi'),
                    React.createElement('div', { className: 'stat-value' }, stats.filled),
                    React.createElement('div', { className: 'stat-detail' }, stats.pct + '% dari total alumni')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon amber' },
                        React.createElement('i', { className: 'fas fa-times-circle' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Belum Mengisi'),
                    React.createElement('div', { className: 'stat-value' }, stats.notFilled),
                    React.createElement('div', { className: 'stat-detail' }, (100 - stats.pct) + '% dari total alumni')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon' },
                        React.createElement('i', { className: 'fas fa-phone-slash' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'No WA Bermasalah'),
                    React.createElement('div', { className: 'stat-value', style: { color: '#ef4444' } }, stats.waBermasalah),
                    React.createElement('div', { className: 'stat-detail' }, 'Salah / Belum ada No WA')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon', style: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' } },
                        React.createElement('i', { className: 'fas fa-briefcase' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Belum Bekerja'),
                    React.createElement('div', { className: 'stat-value' }, stats.belumKerja),
                    React.createElement('div', { className: 'stat-detail' }, 'Status Report "Belum Bekerja"')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon blue' },
                        React.createElement('i', { className: 'fas fa-chart-pie' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Tingkat Respon - Keseluruhan'),
                    React.createElement('div', { className: 'stat-value' }, stats.pctTotalResponse + '%'),
                    React.createElement('div', { className: 'stat-detail' }, 'Total respon alumni (Mengisi & Report)')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon', style: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' } },
                        React.createElement('i', { className: 'fas fa-chart-line' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Tingkat Respon - Yang Mengisi'),
                    React.createElement('div', { className: 'stat-value' }, stats.pct + '%'),
                    React.createElement('div', { className: 'stat-detail' }, 'Dari pengisian form Tracer Study')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon', style: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' } },
                        React.createElement('i', { className: 'fas fa-chart-line' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Tingkat Respon - WA Bermasalah'),
                    React.createElement('div', { className: 'stat-value' }, stats.pctWA + '%'),
                    React.createElement('div', { className: 'stat-detail' }, 'Dari laporan WA Error')
                ),
                React.createElement('div', { className: 'stat-card' },
                    React.createElement('div', { className: 'stat-icon', style: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' } },
                        React.createElement('i', { className: 'fas fa-chart-line' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Tingkat Respon - Belum Bekerja'),
                    React.createElement('div', { className: 'stat-value' }, stats.pctKerja + '%'),
                    React.createElement('div', { className: 'stat-detail' }, 'Dari laporan alumni belum bekerja')
                )
            ),

            // Progress bar
            React.createElement('div', { className: 'tracer-progress-wrapper' },
                React.createElement('div', { className: 'tracer-progress-bar' },
                    React.createElement('div', {
                        className: 'tracer-progress-fill',
                        style: { width: stats.pct + '%' }
                    })
                ),
                React.createElement('div', { className: 'tracer-progress-label' },
                    stats.filled + ' / ' + stats.total + ' alumni telah mengisi tracer study'
                )
            ),

            // Toolbar: search + filter
            React.createElement('div', { className: 'toolbar' },
                React.createElement('div', { className: 'toolbar-left' },
                    React.createElement('div', { className: 'search-box' },
                        React.createElement('i', { className: 'fas fa-search' }),
                        React.createElement('input', {
                            className: 'search-input',
                            type: 'text',
                            placeholder: 'Cari nama atau NIM...',
                            value: searchQuery,
                            onChange: e => setSearchQuery(e.target.value)
                        })
                    )
                ),
                React.createElement('div', { className: 'toolbar-right' },
                    React.createElement('div', { className: 'filter-buttons' },
                        React.createElement('button', {
                            className: `btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`,
                            onClick: () => setFilterStatus('all')
                        }, 'Semua (' + stats.total + ')'),
                        React.createElement('button', {
                            className: `btn btn-sm ${filterStatus === 'filled' ? 'btn-primary' : 'btn-secondary'}`,
                            onClick: () => setFilterStatus('filled')
                        },
                            React.createElement('i', { className: 'fas fa-check-circle', style: { color: filterStatus === 'filled' ? '#fff' : '#10b981' } }),
                            'Sudah (' + stats.filled + ')'
                        ),
                        React.createElement('button', {
                            className: `btn btn-sm ${filterStatus === 'not-filled' ? 'btn-primary' : 'btn-secondary'}`,
                            onClick: () => setFilterStatus('not-filled')
                        },
                            React.createElement('i', { className: 'fas fa-times-circle', style: { color: filterStatus === 'not-filled' ? '#fff' : '#f59e0b' } }),
                            'Belum (' + stats.notFilled + ')'
                        )
                    )
                )
            ),

            // Content: Loading or Cards
            isLoading && alumni.length === 0
                ? React.createElement('div', { className: 'tracer-cards-grid' },
                    Array.from({ length: 8 }).map((_, idx) => React.createElement(TracerSkeletonCard, { key: idx }))
                )
                : filteredAlumni.length === 0
                    ? React.createElement('div', { className: 'table-wrapper' },
                        React.createElement('div', { className: 'empty-state' },
                            React.createElement('div', { className: 'empty-state-icon' },
                                React.createElement('i', { className: 'fas fa-inbox' })
                            ),
                            React.createElement('div', { className: 'empty-state-title' },
                                searchQuery || filterStatus !== 'all' ? 'Tidak ada hasil' : 'Belum ada data'
                            ),
                            React.createElement('div', { className: 'empty-state-desc' },
                                searchQuery
                                    ? 'Tidak ditemukan data yang cocok dengan "' + searchQuery + '"'
                                    : 'Belum ada data alumni di sheet ini'
                            )
                        )
                    )
                    : React.createElement('div', { className: 'tracer-cards-grid' },
                        filteredAlumni.map((a, idx) =>
                            React.createElement('div', {
                                className: `tracer-card ${a.filled ? 'tracer-card-filled' : 'tracer-card-not-filled'}`,
                                key: a._rowIndex || idx
                            },
                                React.createElement('div', { className: 'tracer-card-header' },
                                    React.createElement('div', { className: 'tracer-card-avatar' },
                                        React.createElement('i', { className: 'fas fa-user-graduate' })
                                    ),
                                    React.createElement('div', {
                                        className: `tracer-card-status ${a.filled ? 'status-filled' : (a.masalah ? 'status-reported' : 'status-not-filled')}`
                                    },
                                        React.createElement('i', { className: `fas ${a.filled ? 'fa-check-circle' : (a.masalah ? 'fa-exclamation-triangle' : 'fa-times-circle')}` }),
                                        a.filled ? 'Sudah Mengisi' : (a.masalah ? a.masalah : 'Belum Mengisi'),
                                        (a.filled && a.masalah) && React.createElement('i', { 
                                            className: 'fas fa-exclamation-triangle', 
                                            style: { color: '#ef4444', marginLeft: '4px' },
                                            title: 'Alumni ini memiliki masalah: ' + a.masalah 
                                        })
                                    )
                                ),
                                React.createElement('div', { className: 'tracer-card-body' },
                                    React.createElement('div', { className: 'tracer-card-name' }, a.nama),
                                    React.createElement('div', { className: 'tracer-card-nim' },
                                        React.createElement('i', { className: 'fas fa-id-badge' }),
                                        a.nim || '-'
                                    ),
                                    !a.filled && React.createElement('div', { className: 'tracer-card-actions' },
                                        a.waLink && React.createElement('a', {
                                            className: 'tracer-card-wa-btn',
                                            href: a.waLink,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            title: 'Chat via WhatsApp'
                                        },
                                            React.createElement('i', { className: 'fab fa-whatsapp' }),
                                            formatWANumber(a.waLink)
                                        ),
                                        a.waLink && React.createElement('button', {
                                            className: 'tracer-card-wa-copy-btn',
                                            onClick: () => handleCopyWA(a.waLink),
                                            title: 'Copy Link WA'
                                        },
                                            React.createElement('i', { className: 'far fa-copy' })
                                        ),
                                        React.createElement('button', {
                                            className: a.waLink ? 'tracer-card-wa-copy-btn' : 'tracer-card-wa-btn',
                                            style: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', justifyContent: 'center' },
                                            onClick: () => handleReportMasalah(a),
                                            title: 'Report Masalah'
                                        },
                                            React.createElement('i', { className: 'fas fa-exclamation-triangle' }),
                                            !a.waLink ? ' Report Masalah' : ''
                                        )
                                    )
                                )
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
