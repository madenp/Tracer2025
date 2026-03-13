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

// ============================================
// Tracer Study Page (Main Component)
// ============================================
function TracerStudyPage() {
    const [alumni, setAlumni] = tsUseState([]);
    const [tracerNIMs, setTracerNIMs] = tsUseState([]);
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

    // Cross-reference: build alumni list with tracer status
    const alumniWithStatus = tsUseMemo(() => {
        return alumni.map(a => ({
            ...a,
            filled: a.nim && tracerNIMs.includes(a.nim)
        }));
    }, [alumni, tracerNIMs]);

    // Stats
    const stats = tsUseMemo(() => {
        const total = alumniWithStatus.length;
        const filled = alumniWithStatus.filter(a => a.filled).length;
        const notFilled = total - filled;
        const pct = total > 0 ? Math.round(filled / total * 100) : 0;
        return { total, filled, notFilled, pct };
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
                ),
                React.createElement('div', { className: 'page-header-actions' },
                    React.createElement('div', { 
                        className: `connection-status ${isLoading ? 'loading' : (isConnected ? 'online' : 'offline')}`,
                        style: isLoading ? { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' } : {} 
                    },
                        isLoading 
                            ? React.createElement('i', { className: 'fas fa-spinner fa-spin', style: { marginRight: '4px' } }) 
                            : React.createElement('span', { className: 'dot' }),
                        loadingStatus
                    ),
                    sheets.length > 0 && React.createElement('select', {
                        className: 'navbar-sheet-select',
                        value: selectedSheet,
                        onChange: e => handleSheetChange(e.target.value)
                    },
                        sheets.map(s =>
                            React.createElement('option', { key: s, value: s }, s)
                        )
                    ),
                    React.createElement('button', {
                        className: `btn btn-secondary btn-refresh ${isLoading ? 'loading' : ''}`,
                        onClick: handleRefresh,
                        disabled: isLoading,
                        title: 'Refresh Data'
                    },
                        React.createElement('i', { className: 'fas fa-sync-alt' })
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
                    React.createElement('div', { className: 'stat-icon blue' },
                        React.createElement('i', { className: 'fas fa-chart-pie' })
                    ),
                    React.createElement('div', { className: 'stat-label' }, 'Tingkat Respon'),
                    React.createElement('div', { className: 'stat-value' }, stats.pct + '%'),
                    React.createElement('div', { className: 'stat-detail' }, 'Progress pengisian tracer study')
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
                ? React.createElement('div', { className: 'loading-screen', style: { height: '300px' } },
                    React.createElement('div', { className: 'loading-spinner' }),
                    React.createElement('div', { className: 'loading-text' }, 'Memuat data tracer study...')
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
                                        className: `tracer-card-status ${a.filled ? 'status-filled' : 'status-not-filled'}`
                                    },
                                        React.createElement('i', { className: `fas ${a.filled ? 'fa-check-circle' : 'fa-times-circle'}` }),
                                        a.filled ? 'Sudah Mengisi' : 'Belum Mengisi'
                                    )
                                ),
                                React.createElement('div', { className: 'tracer-card-body' },
                                    React.createElement('div', { className: 'tracer-card-name' }, a.nama),
                                    React.createElement('div', { className: 'tracer-card-nim' },
                                        React.createElement('i', { className: 'fas fa-id-badge' }),
                                        a.nim || '-'
                                    ),
                                    !a.filled && a.waLink && React.createElement('div', { className: 'tracer-card-actions' },
                                        React.createElement('a', {
                                            className: 'tracer-card-wa-btn',
                                            href: a.waLink,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            title: 'Chat via WhatsApp'
                                        },
                                            React.createElement('i', { className: 'fab fa-whatsapp' }),
                                            formatWANumber(a.waLink)
                                        ),
                                        React.createElement('button', {
                                            className: 'tracer-card-wa-copy-btn',
                                            onClick: () => handleCopyWA(a.waLink),
                                            title: 'Copy Link WA'
                                        },
                                            React.createElement('i', { className: 'far fa-copy' })
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
