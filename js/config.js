/**
 * SAKTI "Sistem Alumni Akuntansi Terintegrasi" - Configuration
 */
const CONFIG = {
  // ============================================
  // GANTI URL INI dengan URL Apps Script Anda
  // Deploy > New deployment > Web app > Copy URL
  // ============================================
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxMmacUBJVOwgfiBne7K4krdqS5GSpDVmkeRG4Cbn44YsjfvuOo5IaRDz0X1AWanpL8/exec',

  // Default sheet name
  DEFAULT_SHEET: '3 Januari 2025',

  // Column definitions (key = nomor kolom di Google Sheet)
  COLUMNS: [
    { key: '1', label: 'No', type: 'number', width: '50px' },
    { key: '2', label: 'Nama', type: 'text', width: '180px', searchable: true },
    { key: '3', label: 'L/P', type: 'select', options: ['L', 'P'], width: '50px' },
    { key: '4', label: 'TTL', type: 'text', width: '160px' },
    { key: '5', label: 'Asal SMA', type: 'text', width: '150px', searchable: true },
    { key: '6', label: 'NIM', type: 'text', width: '120px', searchable: true },
    { key: '7', label: 'Jurusan', type: 'text', width: '120px' },
    { key: '8', label: 'Tgl Ujian', type: 'text', width: '110px' },
    { key: '9', label: 'IPK', type: 'text', width: '80px' },
    { key: '10', label: 'Tgl Yudisium', type: 'text', width: '110px' },
    { key: '11', label: 'Predikat', type: 'select', options: ['Cum Laude', 'Sangat Memuaskan', 'Memuaskan'], width: '130px' },
    { key: '12', label: 'Lama Studi (Tahun)', type: 'number', width: '60px' },
    { key: '13', label: 'Lama Studi (Bulan)', type: 'number', width: '60px' },
    { key: '14', label: 'Nilai Skripsi', type: 'text', width: '80px' },
    { key: '15', label: 'Nilai TOEFL', type: 'number', width: '80px' }
  ],

  // Items per page
  PAGE_SIZE: 10,

  // Predikat badge colors
  PREDIKAT_COLORS: {
    'Cum Laude': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    'Sangat Memuaskan': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    'Memuaskan': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }
  },

  // ============================================
  // Tracer Study Configuration
  // ============================================
  TRACER_STUDY_SHEET: 'Tracer 2025',

  TRACER_STUDY_COLUMNS: [
    { key: '1', label: 'No', type: 'number', width: '50px' },
    { key: '2', label: 'Nama', type: 'text', width: '180px', searchable: true },
    { key: '3', label: 'NIM', type: 'text', width: '120px', searchable: true },
    { key: '4', label: 'Tahun Lulus', type: 'text', width: '100px' },
    { key: '5', label: 'Status Kerja', type: 'select', options: ['Bekerja', 'Wirausaha', 'Melanjutkan Studi', 'Belum Bekerja'], width: '140px' },
    { key: '6', label: 'Nama Perusahaan/Instansi', type: 'text', width: '200px', searchable: true },
    { key: '7', label: 'Bidang Pekerjaan', type: 'text', width: '160px' },
    { key: '8', label: 'Gaji (Rp)', type: 'text', width: '120px' },
    { key: '9', label: 'Waktu Tunggu (Bulan)', type: 'number', width: '100px' },
    { key: '10', label: 'Kesesuaian Bidang', type: 'select', options: ['Sangat Sesuai', 'Sesuai', 'Kurang Sesuai', 'Tidak Sesuai'], width: '140px' }
  ],

  // Status Kerja badge colors
  STATUS_KERJA_COLORS: {
    'Bekerja': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    'Wirausaha': { bg: 'rgba(108, 99, 255, 0.15)', text: '#6c63ff', border: 'rgba(108, 99, 255, 0.3)' },
    'Melanjutkan Studi': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    'Belum Bekerja': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }
  },

  // Kesesuaian Bidang badge colors
  KESESUAIAN_COLORS: {
    'Sangat Sesuai': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    'Sesuai': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    'Kurang Sesuai': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    'Tidak Sesuai': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
  }
};
