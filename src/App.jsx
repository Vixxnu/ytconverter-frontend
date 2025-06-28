import React, { useState } from 'react';
import axios from 'axios';

export default function YoutubeDownloader() {
    const [url, setUrl] = useState('');
    const [formats, setFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');

    const BASE_URL = import.meta.env.VITE_API_URL;

    const fetchFormats = async () => {
        try {
            const response = await axios.post(
                `${BASE_URL}/api/formats`,
                { url },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const resList = response.data.resolutions.map(res => ({
                label: res.label,
                value: res.value,
            }));

            if (response.data.audio) {
                resList.unshift({ label: 'MP3 (Audio Only)', value: 'audio' });
            }
            resList.unshift({ label: 'MP4 (Best)', value: 'best' });

            setFormats(resList);
            setError('');
        } catch (err) {
            setError('❌ Failed to fetch formats. Make sure Flask server is running.');
            setFormats([]);
        }
    };

    const downloadVideo = async () => {
        if (!selectedFormat) return;
        setDownloading(true);
        setError('');

        try {
            const response = await axios.post(
                `${BASE_URL}/api/download`,
                {
                    url,
                    resolution: selectedFormat,
                    mode:
                        selectedFormat === 'audio' || selectedFormat === 'best'
                            ? selectedFormat
                            : 'video',
                },
                {
                    responseType: 'blob',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const contentDisposition = response.headers['content-disposition'];
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || 'video.mp4';

            const blob = new Blob([response.data]);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        } catch (err) {
            setError('❌ Failed to download video.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-xl p-6 bg-gray-800 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold mb-4">🎥 YouTube Downloader</h1>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Paste YouTube URL here"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-grow px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
                    />
                    <button
                        onClick={fetchFormats}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
                    >
                        Convert
                    </button>
                </div>

                {formats.length > 0 && (
                    <div className="mt-4">
                        <select
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                        >
                            <option value="">Select Format</option>
                            {formats.map((f, idx) => (
                                <option key={idx} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>

                        <button
                            className="mt-4 w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
                            onClick={downloadVideo}
                            disabled={downloading || !selectedFormat}
                        >
                            {downloading ? 'Downloading...' : 'Download'}
                        </button>
                    </div>
                )}

                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
}
