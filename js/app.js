const { useState, useEffect, useCallback, useMemo, useRef } = React;

// ============================================
// API Service
// ============================================
const API = {
    async fetchData(sheetName) {
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=read&sheet=${encodeURIComponent(sheetName)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to fetch data');
        return json;
    },

    async fetchSheets() {
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=getSheets`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to fetch sheets');
        return json.sheets;
    },

    async createRow(sheetName, data) {
        const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'create', sheet: sheetName, data })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to create');
        return json;
    },

    async updateRow(sheetName, rowIndex, data) {
        const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'update', sheet: sheetName, rowIndex, data })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to update');
        return json;
    },

    async deleteRow(sheetName, rowIndex) {
        const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'delete', sheet: sheetName, rowIndex })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to delete');
        return json;
    }
};

// ============================================
// Toast Component
// ============================================
function Toast({ toasts, onRemove }) {
    useEffect(() => {
        toasts.forEach(t => {
            if (!t._timer) {
                t._timer = setTimeout(() => onRemove(t.id), 3500);
            }
        });
    }, [toasts]);

    return React.createElement('div', { className: 'toast-container' },
        toasts.map(t =>
            React.createElement('div', { className: `toast ${t.type}`, key: t.id },
                React.createElement('i', { className: `toast-icon fas ${t.type === 'success' ? 'fa-check-circle' : t.type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}` }),
                React.createElement('span', { className: 'toast-message' }, t.message)
            )
        )
    );
}

// ============================================
// Navbar Component
// ============================================
function Navbar({ currentSheet, sheets, onSheetChange, onRefresh, isLoading, isConnected, currentPage }) {
    const navLinks = [
        { hash: '#home', label: 'Dashboard', icon: 'fa-th-large' },
        { hash: '#tracer-study', label: 'Tracer Study', icon: 'fa-clipboard-list' },
        { hash: '#monev', label: 'Monev', icon: 'fa-chart-line' }
    ];

    return React.createElement('nav', { className: 'navbar' },
        React.createElement('div', { className: 'navbar-left' },
            React.createElement('div', { className: 'navbar-brand' },
                React.createElement('div', { className: 'navbar-icon' },
                    React.createElement('i', { className: 'fas fa-graduation-cap' })
                ),
                React.createElement('div', null,
                    React.createElement('div', { className: 'navbar-title' }, 'SAKTI'),
                    React.createElement('div', { className: 'navbar-subtitle' }, 'Sistem Alumni Akuntansi Terintegrasi')
                )
            ),
            React.createElement('div', { className: 'navbar-nav' },
                navLinks.map(link =>
                    React.createElement('a', {
                        key: link.hash,
                        href: link.hash,
                        className: `nav-link ${currentPage === link.hash ? 'active' : ''}`
                    },
                        React.createElement('i', { className: `fas ${link.icon}` }),
                        link.label
                    )
                )
            )
        ),
        React.createElement('div', { className: 'navbar-actions' },
            React.createElement('div', { className: `connection-status ${isConnected ? 'online' : 'offline'}` },
                React.createElement('span', { className: 'dot' }),
                isConnected ? 'Connected' : 'Offline'
            ),
            sheets.length > 0 && React.createElement('select', {
                className: 'navbar-sheet-select',
                value: currentSheet,
                onChange: e => onSheetChange(e.target.value)
            },
                sheets.map(s =>
                    React.createElement('option', { key: s, value: s }, s)
                )
            ),
            React.createElement('button', {
                className: `btn btn-secondary btn-refresh ${isLoading ? 'loading' : ''}`,
                onClick: onRefresh,
                disabled: isLoading,
                title: 'Refresh Data'
            },
                React.createElement('i', { className: 'fas fa-sync-alt' })
            )
        )
    );
}

// ============================================
// Stats Cards Component
// ============================================
function StatsCards({ data }) {
    const stats = useMemo(() => {
        const total = data.length;
        const male = data.filter(d => d['3'] === 'L').length;
        const female = data.filter(d => d['3'] === 'P').length;
        const cumLaude = data.filter(d => d['11'] === 'Cum Laude').length;
        const avgToefl = total > 0
            ? Math.round(data.reduce((sum, d) => sum + (Number(d['15']) || 0), 0) / total)
            : 0;
        return { total, male, female, cumLaude, avgToefl };
    }, [data]);

    const cards = [
        { icon: 'fa-users', color: 'purple', label: 'Total Alumni', value: stats.total, detail: `${stats.male} Laki-laki · ${stats.female} Perempuan` },
        { icon: 'fa-venus-mars', color: 'green', label: 'Rasio Gender', value: `${stats.male}:${stats.female}`, detail: 'Laki-laki : Perempuan' },
        { icon: 'fa-award', color: 'blue', label: 'Cum Laude', value: stats.cumLaude, detail: `${stats.total > 0 ? Math.round(stats.cumLaude / stats.total * 100) : 0}% dari total alumni` },
        { icon: 'fa-language', color: 'amber', label: 'Rata-rata TOEFL', value: stats.avgToefl, detail: 'Skor rata-rata keseluruhan' }
    ];

    return React.createElement('div', { className: 'stats-grid' },
        cards.map((card, i) =>
            React.createElement('div', { className: 'stat-card', key: i },
                React.createElement('div', { className: `stat-icon ${card.color}` },
                    React.createElement('i', { className: `fas ${card.icon}` })
                ),
                React.createElement('div', { className: 'stat-label' }, card.label),
                React.createElement('div', { className: 'stat-value' }, card.value),
                React.createElement('div', { className: 'stat-detail' }, card.detail)
            )
        )
    );
}

// ============================================
// Predikat Badge
// ============================================
function PredikatBadge({ predikat }) {
    if (!predikat) return React.createElement('span', { className: 'badge' }, '-');
    const cls = predikat === 'Cum Laude' ? 'badge-cum-laude'
        : predikat === 'Sangat Memuaskan' ? 'badge-sangat-memuaskan'
            : 'badge-memuaskan';
    return React.createElement('span', { className: `badge ${cls}` }, predikat);
}

// ============================================
// Gender Badge
// ============================================
function GenderBadge({ gender }) {
    const cls = gender === 'L' ? 'male' : 'female';
    return React.createElement('span', { className: `badge-gender ${cls}` }, gender);
}

// ============================================
// Data Table Component
// ============================================
function DataTable({ data, onEdit, onDelete, onView, searchQuery }) {
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = CONFIG.PAGE_SIZE;

    useEffect(() => { setCurrentPage(1); }, [searchQuery, data.length]);

    const filteredData = useMemo(() => {
        if (!searchQuery) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(row =>
            CONFIG.COLUMNS.some(col =>
                col.searchable && String(row[col.key] || '').toLowerCase().includes(q)
            )
        );
    }, [data, searchQuery]);

    const sortedData = useMemo(() => {
        if (!sortKey) return filteredData;
        return [...filteredData].sort((a, b) => {
            const va = a[sortKey] || '';
            const vb = b[sortKey] || '';
            if (typeof va === 'number' && typeof vb === 'number') {
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            return sortDir === 'asc'
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
    }, [filteredData, sortKey, sortDir]);

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const pagedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const renderPagination = () => {
        const buttons = [];
        buttons.push(
            React.createElement('button', {
                className: 'pagination-btn', key: 'prev',
                disabled: currentPage === 1,
                onClick: () => setCurrentPage(p => p - 1)
            }, React.createElement('i', { className: 'fas fa-chevron-left' }))
        );

        const maxButtons = 5;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);

        for (let i = start; i <= end; i++) {
            buttons.push(
                React.createElement('button', {
                    className: `pagination-btn ${i === currentPage ? 'active' : ''}`,
                    key: i, onClick: () => setCurrentPage(i)
                }, i)
            );
        }

        buttons.push(
            React.createElement('button', {
                className: 'pagination-btn', key: 'next',
                disabled: currentPage === totalPages || totalPages === 0,
                onClick: () => setCurrentPage(p => p + 1)
            }, React.createElement('i', { className: 'fas fa-chevron-right' }))
        );

        return buttons;
    };

    if (sortedData.length === 0) {
        return React.createElement('div', { className: 'table-wrapper' },
            React.createElement('div', { className: 'empty-state' },
                React.createElement('div', { className: 'empty-state-icon' },
                    React.createElement('i', { className: 'fas fa-inbox' })
                ),
                React.createElement('div', { className: 'empty-state-title' },
                    searchQuery ? 'Tidak ada hasil' : 'Belum ada data'
                ),
                React.createElement('div', { className: 'empty-state-desc' },
                    searchQuery
                        ? `Tidak ditemukan data yang cocok dengan "${searchQuery}"`
                        : 'Klik tombol "Tambah Data" untuk memulai menambahkan data alumni'
                )
            )
        );
    }

    return React.createElement('div', { className: 'table-wrapper' },
        React.createElement('div', { className: 'table-scroll' },
            React.createElement('table', { className: 'data-table' },
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        React.createElement('th', { style: { width: '50px', textAlign: 'center' } }, 'No'),
                        React.createElement('th', {
                            onClick: () => handleSort('2'),
                            className: sortKey === '2' ? 'sorted' : ''
                        }, 'Nama', sortKey === '2' && React.createElement('i', {
                            className: `sort-icon fas fa-sort-${sortDir === 'asc' ? 'up' : 'down'}`
                        })),
                        React.createElement('th', { style: { width: '50px', textAlign: 'center' } }, 'L/P'),
                        React.createElement('th', null, 'TTL'),
                        React.createElement('th', {
                            onClick: () => handleSort('5'),
                            className: sortKey === '5' ? 'sorted' : ''
                        }, 'Asal SMA', sortKey === '5' && React.createElement('i', {
                            className: `sort-icon fas fa-sort-${sortDir === 'asc' ? 'up' : 'down'}`
                        })),
                        React.createElement('th', null, 'NIM'),
                        React.createElement('th', null, 'Jurusan'),
                        React.createElement('th', null, 'Tgl Ujian'),
                        React.createElement('th', null, 'IPK'),
                        React.createElement('th', null, 'Tgl Yudisium'),
                        React.createElement('th', null, 'Predikat'),
                        React.createElement('th', null, 'Lama Studi (Thn)'),
                        React.createElement('th', null, 'Lama Studi (Bln)'),
                        React.createElement('th', null, 'Nilai Skripsi'),
                        React.createElement('th', null, 'Nilai TOEFL'),
                        React.createElement('th', { style: { width: '120px', textAlign: 'center' } }, 'Aksi')
                    )
                ),
                React.createElement('tbody', null,
                    pagedData.map((row, idx) =>
                        React.createElement('tr', { key: row._rowIndex || idx },
                            React.createElement('td', { className: 'col-number' }, (currentPage - 1) * pageSize + idx + 1),
                            React.createElement('td', { style: { fontWeight: 500 } }, row['2'] || '-'),
                            React.createElement('td', { style: { textAlign: 'center' } },
                                React.createElement(GenderBadge, { gender: row['3'] })
                            ),
                            React.createElement('td', null, row['4'] || '-'),
                            React.createElement('td', null, row['5'] || '-'),
                            React.createElement('td', null, row['6'] || '-'),
                            React.createElement('td', null, row['7'] || '-'),
                            React.createElement('td', null, row['8'] || '-'),
                            React.createElement('td', null, row['9'] || '-'),
                            React.createElement('td', null, row['10'] || '-'),
                            React.createElement('td', null,
                                React.createElement(PredikatBadge, { predikat: row['11'] })
                            ),
                            React.createElement('td', { style: { textAlign: 'center' } }, row['12'] || '-'),
                            React.createElement('td', { style: { textAlign: 'center' } }, row['13'] || '-'),
                            React.createElement('td', null, row['14'] || '-'),
                            React.createElement('td', { style: { textAlign: 'center' } }, row['15'] || '-'),
                            React.createElement('td', null,
                                React.createElement('div', { className: 'actions-cell' },
                                    React.createElement('button', {
                                        className: 'btn-icon view', title: 'Detail',
                                        onClick: () => onView(row)
                                    }, React.createElement('i', { className: 'fas fa-eye' })),
                                    React.createElement('button', {
                                        className: 'btn-icon edit', title: 'Edit',
                                        onClick: () => onEdit(row)
                                    }, React.createElement('i', { className: 'fas fa-edit' })),
                                    React.createElement('button', {
                                        className: 'btn-icon delete', title: 'Hapus',
                                        onClick: () => onDelete(row)
                                    }, React.createElement('i', { className: 'fas fa-trash-alt' }))
                                )
                            )
                        )
                    )
                )
            )
        ),
        totalPages > 1 && React.createElement('div', { className: 'pagination' },
            React.createElement('div', { className: 'pagination-info' },
                `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, sortedData.length)} dari ${sortedData.length} data`
            ),
            React.createElement('div', { className: 'pagination-buttons' }, renderPagination())
        )
    );
}

// ============================================
// Form Modal Component
// ============================================
function FormModal({ isOpen, onClose, onSubmit, editData, isSubmitting }) {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (editData) {
            setFormData({ ...editData });
        } else {
            const empty = {};
            CONFIG.COLUMNS.forEach(col => { empty[col.key] = ''; });
            setFormData(empty);
        }
    }, [editData, isOpen]);

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    const isEdit = !!editData;

    const renderField = (col) => {
        if (col.type === 'select') {
            return React.createElement('select', {
                className: 'form-select',
                value: formData[col.key] || '',
                onChange: e => handleChange(col.key, e.target.value)
            },
                React.createElement('option', { value: '' }, `Pilih ${col.label}`),
                col.options.map(opt =>
                    React.createElement('option', { key: opt, value: opt }, opt)
                )
            );
        }
        return React.createElement('input', {
            className: 'form-input',
            type: col.type === 'number' ? 'number' : 'text',
            placeholder: col.label,
            value: formData[col.key] || '',
            onChange: e => handleChange(col.key, e.target.value)
        });
    };

    // All editable columns (skip No / key '1')
    const editableCols = CONFIG.COLUMNS.filter(c => c.key !== '1');

    return React.createElement('div', { className: 'modal-overlay', onClick: onClose },
        React.createElement('div', { className: 'modal', onClick: e => e.stopPropagation() },
            React.createElement('div', { className: 'modal-header' },
                React.createElement('div', { className: 'modal-title' },
                    React.createElement('i', { className: `fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'}` }),
                    isEdit ? 'Edit Data Alumni' : 'Tambah Data Alumni'
                ),
                React.createElement('button', { className: 'modal-close', onClick: onClose },
                    React.createElement('i', { className: 'fas fa-times' })
                )
            ),
            React.createElement('form', { onSubmit: handleSubmit },
                React.createElement('div', { className: 'modal-body' },
                    React.createElement('div', { className: 'form-grid' },
                        // Data Pribadi section (keys 2-8)
                        React.createElement('div', { className: 'form-section-title' },
                            React.createElement('i', { className: 'fas fa-user' }), 'Data Pribadi'
                        ),
                        editableCols.filter(c => ['2', '3', '4', '5', '6', '7', '8'].includes(c.key)).map(col =>
                            React.createElement('div', {
                                className: `form-group ${col.key === '4' ? 'full-width' : ''}`,
                                key: col.key
                            },
                                React.createElement('label', { className: 'form-label' }, col.label),
                                renderField(col)
                            )
                        ),
                        // Yudisium section (keys 9-11)
                        React.createElement('div', { className: 'form-section-title' },
                            React.createElement('i', { className: 'fas fa-award' }), 'Yudisium'
                        ),
                        editableCols.filter(c => ['9', '10', '11'].includes(c.key)).map(col =>
                            React.createElement('div', { className: 'form-group', key: col.key },
                                React.createElement('label', { className: 'form-label' }, col.label),
                                renderField(col)
                            )
                        ),
                        // Lama Studi section (keys 12-13)
                        React.createElement('div', { className: 'form-section-title' },
                            React.createElement('i', { className: 'fas fa-clock' }), 'Lama Studi'
                        ),
                        editableCols.filter(c => ['12', '13'].includes(c.key)).map(col =>
                            React.createElement('div', { className: 'form-group', key: col.key },
                                React.createElement('label', { className: 'form-label' }, col.label),
                                renderField(col)
                            )
                        ),
                        // Nilai section (keys 14-15)
                        React.createElement('div', { className: 'form-section-title' },
                            React.createElement('i', { className: 'fas fa-file-alt' }), 'Nilai'
                        ),
                        editableCols.filter(c => ['14', '15'].includes(c.key)).map(col =>
                            React.createElement('div', { className: 'form-group', key: col.key },
                                React.createElement('label', { className: 'form-label' }, col.label),
                                renderField(col)
                            )
                        )
                    )
                ),
                React.createElement('div', { className: 'modal-footer' },
                    React.createElement('button', {
                        type: 'button', className: 'btn btn-secondary', onClick: onClose
                    }, 'Batal'),
                    React.createElement('button', {
                        type: 'submit', className: 'btn btn-primary', disabled: isSubmitting
                    },
                        isSubmitting
                            ? React.createElement(React.Fragment, null,
                                React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                'Menyimpan...'
                            )
                            : React.createElement(React.Fragment, null,
                                React.createElement('i', { className: 'fas fa-save' }),
                                isEdit ? 'Perbarui' : 'Simpan'
                            )
                    )
                )
            )
        )
    );
}

// ============================================
// Detail Modal Component
// ============================================
function DetailModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    const item = (label, value, fullWidth) =>
        React.createElement('div', { className: `detail-item ${fullWidth ? 'full-width' : ''}` },
            React.createElement('div', { className: 'detail-label' }, label),
            React.createElement('div', { className: 'detail-value' }, value || '-')
        );

    return React.createElement('div', { className: 'modal-overlay', onClick: onClose },
        React.createElement('div', { className: 'modal', onClick: e => e.stopPropagation() },
            React.createElement('div', { className: 'modal-header' },
                React.createElement('div', { className: 'modal-title' },
                    React.createElement('i', { className: 'fas fa-id-card' }),
                    'Detail Alumni'
                ),
                React.createElement('button', { className: 'modal-close', onClick: onClose },
                    React.createElement('i', { className: 'fas fa-times' })
                )
            ),
            React.createElement('div', { className: 'modal-body' },
                React.createElement('div', { className: 'detail-grid' },
                    item('Nama Lengkap', data['2'], true),
                    item('Jenis Kelamin', data['3'] === 'L' ? 'Laki-laki' : 'Perempuan'),
                    item('NIM', data['6']),
                    item('TTL', data['4'], true),
                    item('Asal SMA', data['5']),
                    item('Jurusan', data['7']),
                    item('Tgl Ujian', data['8']),

                    React.createElement('div', { className: 'detail-section-title' },
                        React.createElement('i', { className: 'fas fa-award' }), 'Yudisium'
                    ),
                    item('IPK', data['9']),
                    item('Tgl Yudisium', data['10']),
                    item('Predikat', React.createElement(PredikatBadge, { predikat: data['11'] })),

                    React.createElement('div', { className: 'detail-section-title' },
                        React.createElement('i', { className: 'fas fa-clock' }), 'Lama Studi'
                    ),
                    item('Tahun', data['12']),
                    item('Bulan', data['13']),

                    React.createElement('div', { className: 'detail-section-title' },
                        React.createElement('i', { className: 'fas fa-file-alt' }), 'Nilai'
                    ),
                    item('Nilai Skripsi', data['14']),
                    item('Nilai TOEFL', data['15'])
                )
            ),
            React.createElement('div', { className: 'modal-footer' },
                React.createElement('button', {
                    className: 'btn btn-secondary', onClick: onClose
                }, 'Tutup')
            )
        )
    );
}

// ============================================
// Main App Component
// ============================================
function App() {
    const [data, setData] = useState([]);
    const [sheets, setSheets] = useState([]);
    const [currentSheet, setCurrentSheet] = useState(CONFIG.DEFAULT_SHEET);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toasts, setToasts] = useState([]);

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toastIdRef = useRef(0);

    const addToast = useCallback((message, type = 'success') => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const loadData = useCallback(async (sheet) => {
        setIsLoading(true);
        try {
            const result = await API.fetchData(sheet || currentSheet);
            setData(result.data || []);
            setIsConnected(true);
        } catch (error) {
            console.error('Load data error:', error);
            setIsConnected(false);
            addToast('Gagal memuat data: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentSheet]);

    const loadSheets = useCallback(async () => {
        try {
            const sheetList = await API.fetchSheets();
            setSheets(sheetList);
        } catch (error) {
            console.error('Load sheets error:', error);
        }
    }, []);

    useEffect(() => {
        loadData(currentSheet);
        loadSheets();
    }, [currentSheet]);

    const handleSheetChange = (sheet) => {
        setCurrentSheet(sheet);
        setSearchQuery('');
    };

    const handleRefresh = () => {
        loadData(currentSheet);
        addToast('Data berhasil dimuat ulang', 'success');
    };

    // CRUD handlers
    const handleCreate = () => {
        setEditData(null);
        setIsFormOpen(true);
    };

    const handleEdit = (row) => {
        setEditData(row);
        setIsFormOpen(true);
    };

    const handleView = (row) => {
        setDetailData(row);
        setIsDetailOpen(true);
    };

    const handleDelete = async (row) => {
        const result = await Swal.fire({
            title: 'Hapus Data?',
            text: `Apakah Anda yakin ingin menghapus data "${row['2']}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await API.deleteRow(currentSheet, row._rowIndex);
                addToast('Data berhasil dihapus', 'success');
                loadData(currentSheet);
            } catch (error) {
                addToast('Gagal menghapus data: ' + error.message, 'error');
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            if (editData) {
                await API.updateRow(currentSheet, editData._rowIndex, formData);
                addToast('Data berhasil diperbarui', 'success');
            } else {
                await API.createRow(currentSheet, formData);
                addToast('Data berhasil ditambahkan', 'success');
            }
            setIsFormOpen(false);
            setEditData(null);
            loadData(currentSheet);
        } catch (error) {
            addToast('Gagal menyimpan data: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return React.createElement(React.Fragment, null,
        React.createElement(Toast, { toasts, onRemove: removeToast }),
        React.createElement(Navbar, {
            currentSheet, sheets,
            onSheetChange: handleSheetChange,
            onRefresh: handleRefresh,
            isLoading, isConnected,
            currentPage: '#home'
        }),
        React.createElement('div', { className: 'container' },
            React.createElement(StatsCards, { data }),
            React.createElement('div', { className: 'toolbar' },
                React.createElement('div', { className: 'toolbar-left' },
                    React.createElement('div', { className: 'search-box' },
                        React.createElement('i', { className: 'fas fa-search' }),
                        React.createElement('input', {
                            className: 'search-input',
                            type: 'text',
                            placeholder: 'Cari nama, NIM, atau asal SMA...',
                            value: searchQuery,
                            onChange: e => setSearchQuery(e.target.value)
                        })
                    )
                ),
                React.createElement('div', { className: 'toolbar-right' },
                    React.createElement('button', {
                        className: 'btn btn-primary',
                        onClick: handleCreate
                    },
                        React.createElement('i', { className: 'fas fa-plus' }),
                        'Tambah Data'
                    )
                )
            ),
            isLoading && data.length === 0
                ? React.createElement('div', { className: 'loading-screen', style: { height: '300px' } },
                    React.createElement('div', { className: 'loading-spinner' }),
                    React.createElement('div', { className: 'loading-text' }, 'Memuat data...')
                )
                : React.createElement(DataTable, {
                    data, onEdit: handleEdit, onDelete: handleDelete,
                    onView: handleView, searchQuery
                }),
                
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
        ),
        React.createElement(FormModal, {
            isOpen: isFormOpen,
            onClose: () => { setIsFormOpen(false); setEditData(null); },
            onSubmit: handleFormSubmit,
            editData, isSubmitting
        }),
        React.createElement(DetailModal, {
            isOpen: isDetailOpen,
            onClose: () => { setIsDetailOpen(false); setDetailData(null); },
            data: detailData
        })
    );
}

// ============================================
// Hash Router
// ============================================
function HashRouter() {
    const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentHash(window.location.hash || '#home');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Normalize hash
    const hash = currentHash || '#home';

    switch (hash) {
        case '#tracer-study':
            return React.createElement(TracerStudyPage);
        case '#monev':
            return React.createElement(MonevPage);
        case '#home':
        default:
            return React.createElement(App);
    }
}

// ============================================
// Mount App with Router
// ============================================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(HashRouter));
