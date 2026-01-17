import React, { useState, useEffect } from "react";
import { X, Upload, FileText, Image, Mail, ExternalLink, Trash2, CheckCircle, Video, Download, PlayCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import API_BASE_URL from "../../config/api";
import axios from "axios";

const JobCompletionModal = ({ quotation, onClose, onUpdate }) => {
    const { darkMode } = useTheme();
    const [activeTab, setActiveTab] = useState("images"); // images, docs, emails
    const [loading, setLoading] = useState(false);

    // Viewer State
    const [selectedMedia, setSelectedMedia] = useState(null);

    // State for Media Lists
    // State for Media Lists
    const [beforeMedia, setBeforeMedia] = useState([]);
    const [afterMedia, setAfterMedia] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [emails, setEmails] = useState([]);

    // Fetch Media on Mount
    useEffect(() => {
        const fetchMedia = async () => {
            if (!quotation?.id) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/jobs/${quotation.id}/media`);
                if (res.data.success) {
                    const allMedia = res.data.data;

                    // Categorize Media
                    // BEFORE: Images/Videos that are type BEFORE or NULL (legacy)
                    setBeforeMedia(allMedia.filter(img =>
                        (img.type === 'BEFORE' || !img.type) &&
                        (img.file_type === 'IMAGE' || img.file_type === 'VIDEO' || !img.file_type) // Include undefined file_type as image for legacy
                    ));

                    // AFTER: Images/Videos that are type AFTER
                    setAfterMedia(allMedia.filter(img =>
                        img.type === 'AFTER' &&
                        (img.file_type === 'IMAGE' || img.file_type === 'VIDEO')
                    ));

                    // DOCUMENTS: Any file_type DOCUMENT or specifically PDF
                    setDocuments(allMedia.filter(img =>
                        img.file_type === 'DOCUMENT' ||
                        img.original_name?.toLowerCase().endsWith('.pdf')
                    ));

                    // EMAILS: Any .msg .eml files (Currently using Document logic, but prepared for separate tab)
                    setEmails(allMedia.filter(img =>
                        img.original_name?.toLowerCase().endsWith('.msg') ||
                        img.original_name?.toLowerCase().endsWith('.eml')
                    ));
                }
            } catch (error) {
                console.error("Failed to fetch job media:", error);
            }
        };
        fetchMedia();
    }, [quotation.id]);

    const handleFileUpload = async (e, type) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Resolve Job ID (Quotation IS the Job model)
        let jobId = quotation.id;

        console.log("🔍 JobCompletionModal: Quotation Data", quotation);
        console.log("🔍 JobCompletionModal: Resolved Job ID", jobId);

        // Debugging
        if (!jobId || jobId === 'undefined' || jobId === 'null') {
            console.error("❌ Invalid Job ID. Quotation Object:", quotation);
            alert(`System Error: Invalid Job ID (${jobId}). Please check console for details.`);
            return;
        }

        setLoading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        // Map UI types to Backend types
        let backendType = 'BEFORE';
        if (type === 'after' || type === 'doc' || type === 'email') backendType = 'AFTER';
        if (type === 'before') backendType = 'BEFORE';

        formData.append('type', backendType);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/jobs/${jobId}/upload-media`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const newFiles = res.data.data;

                // Update Local State based on what we uploaded
                if (type === 'before') {
                    setBeforeMedia(prev => [...prev, ...newFiles]);
                } else if (type === 'after') {
                    setAfterMedia(prev => [...prev, ...newFiles]);
                } else if (type === 'doc') {
                    // Filter for Docs
                    setDocuments(prev => [...prev, ...newFiles]);
                } else if (type === 'email') {
                    setEmails(prev => [...prev, ...newFiles]);
                }

                // If it was generic image/video, update main lists too if needed
                // actually we should probably re-fetch or just push. 
                // pushing is faster.
                if (onUpdate) onUpdate(); // Refresh parent list
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const isVideo = (url) => {
        return url?.match(/\.(mp4|webm|ogg|mov)$/i);
    };

    // Helper to construct full URL
    const getFileUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const renderMediaList = (items, type) => (
        <div className="space-y-3">
            {items.length === 0 ? (
                <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
                    {type === 'before' ? <Image className="w-8 h-8 mx-auto mb-2 opacity-50" /> : <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />}
                    <p className="text-xs">No {type} media yet</p>
                </div>
            ) : (
                items.map((media, idx) => {
                    const fullUrl = getFileUrl(media.image_url);
                    return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-all group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                {/* Thumbnail */}
                                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                    {isVideo(fullUrl) ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                            <video src={fullUrl} className="w-full h-full object-cover opacity-80" />
                                            <PlayCircle className="absolute w-6 h-6 text-white opacity-80" />
                                        </div>
                                    ) : (
                                        <img src={fullUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-sm truncate" title={media.original_name || media.file_name}>
                                        {media.original_name || media.file_name || `Image #${idx + 1}`}
                                    </h4>
                                    <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
                                        <span>Uploaded: {new Date(media.createdAt).toLocaleString()}</span>
                                        <span>Type: {media.file_type || 'IMAGE'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedMedia(media)}
                                    className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors"
                                    title="View/Play"
                                >
                                    {isVideo(fullUrl) ? <PlayCircle size={18} /> : <ExternalLink size={18} />}
                                </button>
                                <button className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderDocumentList = (items, type) => (
        <div className="space-y-3">
            {items.length === 0 ? (
                <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
                    <FileText className="w-8 h-8 opacity-50 mb-2" />
                    <p className="text-xs">No {type} uploaded yet</p>
                </div>
            ) : (
                items.map((doc, idx) => {
                    const fullUrl = getFileUrl(doc.image_url);
                    return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                    {doc.original_name?.endsWith('.pdf') ? (
                                        <FileText className="w-8 h-8 text-red-500" />
                                    ) : (
                                        <Mail className="w-8 h-8 text-blue-500" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold truncate text-sm" title={doc.original_name}>
                                        {doc.original_name || 'Unnamed File'}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {new Date(doc.createdAt).toLocaleDateString()} • {doc.file_type}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedMedia(doc)}
                                    className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors"
                                    title="View"
                                >
                                    <ExternalLink size={18} />
                                </button>
                                <button className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>

                {/* Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            Job Completion & Attachments
                        </h2>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                            {quotation.quote_no} • {quotation.Job?.mr_no} • {quotation.Job?.Brand?.brand_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    {[
                        { id: "images", label: "Media (Images/Video)", icon: Image },
                        { id: "docs", label: "Documents (PDF)", icon: FileText },
                        { id: "emails", label: "Saved Emails", icon: Mail },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-all border-b-2 ${activeTab === tab.id
                                ? "border-cyan-500 text-cyan-500 bg-cyan-50/10"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* MEDIA TAB */}
                    {activeTab === 'images' && (
                        <div className="space-y-8">
                            {/* Before Images */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-400"></span> Before Work
                                    </h3>
                                    <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                                        <Upload className="w-4 h-4" /> Add Before Media
                                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'before')} />
                                    </label>
                                </div>
                                {renderMediaList(beforeMedia, 'before')}
                            </div>

                            {/* Section Divider */}
                            <hr className={`border-dashed ${darkMode ? "border-gray-700" : "border-gray-200"}`} />

                            {/* After Images */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400"></span> After Completion
                                    </h3>
                                    <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-none transition-all">
                                        <Upload className="w-4 h-4" /> Upload Completion Media
                                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'after')} />
                                    </label>
                                </div>
                                {renderMediaList(afterMedia, 'after')}
                            </div>
                        </div>
                    )}

                    {/* DOCUMENTS TAB */}
                    {activeTab === 'docs' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Job Documents</h3>
                                <label className="cursor-pointer bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-500/30">
                                    <Upload className="w-4 h-4" /> Upload Document
                                    <input type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'doc')} />
                                </label>
                            </div>
                            {renderDocumentList(documents, 'document')}
                        </div>
                    )}

                    {/* EMAILS TAB */}
                    {activeTab === 'emails' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Saved Correspondence</h3>
                                <label className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30">
                                    <Upload className="w-4 h-4" /> Upload Email
                                    <input type="file" multiple accept=".pdf,.msg,.eml" className="hidden" onChange={(e) => handleFileUpload(e, 'email')} />
                                </label>
                            </div>
                            {renderDocumentList(emails, 'email')}
                        </div>
                    )}
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                            <div className="animate-spin text-cyan-500 mb-4">
                                <Upload size={48} />
                            </div>
                            <h3 className="text-lg font-bold">Uploading...</h3>
                            <p className="text-sm text-gray-500">Please wait while we secure your files.</p>
                        </div>
                    </div>
                )}

                {/* Media Viewer Overlay */}
                {selectedMedia && (
                    <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
                        {/* Toolbar */}
                        <div className="absolute top-4 right-4 flex items-center gap-4 z-[80]">
                            <a
                                href={getFileUrl(selectedMedia.image_url)}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                                title="Download Original"
                            >
                                <Download className="w-6 h-6" />
                            </a>
                            <button
                                onClick={() => setSelectedMedia(null)}
                                className="p-3 bg-white/10 hover:bg-red-500/80 text-white rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="w-full h-full flex items-center justify-center max-w-7xl mx-auto">
                            {selectedMedia.file_type === 'VIDEO' || isVideo(selectedMedia.image_url) ? (
                                <video
                                    src={getFileUrl(selectedMedia.image_url)}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                                />
                            ) : selectedMedia.file_type === 'DOCUMENT' || selectedMedia.original_name?.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={getFileUrl(selectedMedia.image_url)}
                                    className="w-full h-[90vh] bg-white rounded-lg shadow-2xl"
                                    title="PDF Viewer"
                                />
                            ) : (
                                <img
                                    src={getFileUrl(selectedMedia.image_url)}
                                    alt="Preview"
                                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                />
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 pointer-events-none">
                            <p className="font-semibold text-lg drop-shadow-md">{selectedMedia.original_name || selectedMedia.file_name}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SaveIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export default JobCompletionModal;
