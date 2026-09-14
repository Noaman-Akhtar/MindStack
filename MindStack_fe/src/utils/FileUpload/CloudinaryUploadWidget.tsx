import { useRef } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../config';

export type ContentDoc = {
    name: string;
    url: string;
    type: string;
    size: number;
    cloudinaryId: string;
};

type Props = {
    multiple?: boolean;
    folder?: string;
    allowedFormats?: string[];
    buttonText?: string;
    onComplete: (docs: ContentDoc[]) => void;
};

declare global {
    interface Window {
        cloudinary?: any;
    }
}

export function CloudinaryUploadWidget({
    multiple = true,
    folder,
    allowedFormats,
    buttonText = 'Upload files',
    onComplete
}: Props) {
    const collected = useRef<ContentDoc[]>([]);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY as string;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
    const backendBase = BACKEND_URL;

    function mapInfoToDoc(info: any): ContentDoc {
        const name =
            info.original_filename && info.format
                ? `${info.original_filename}.${info.format}`
                : info.original_filename || info.public_id;

        const url = info.secure_url || info.url;
        const type =
            (info.resource_type && info.format
                ? `${info.resource_type}/${info.format}`
                : info.mime_type) ||
            (info.resource_type === 'raw'
                ? 'application/octet-stream'
                : info.resource_type || 'raw');

        const size = info.bytes ?? 0;
        const cloudinaryId = info.public_id;

        return { name, url, type, size, cloudinaryId };
    }

    const openWidget = async () => {
        if (!cloudName || !apiKey || !uploadPreset) {
            alert('Missing Cloudinary envs');
            return;
        }

        collected.current = [];

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName,
                uploadPreset,
                apiKey,
                multiple,
                maxFiles: multiple ? 10 : 1,
                folder,
                sources: ['local', 'url'],
                clientAllowedFormats: allowedFormats,
                theme:'violet',
                styles: {
                    palette: {
                        window: '#FFFFFF',
                        sourceBg: '#F4F4F5',
                        windowBorder: '#64748B',
                        tabIcon: '#000000',
                        menuIcons: '#000000',
                        textDark: '#000000',
                        textLight: '#6B7280',
                        link: '#111827',
                        action: '#111827',
                        error: '#EF4444',
                        inProgress: '#111827',
                        complete: '#10B981',
                        sourceBgHover: '#E5E7EB',
                    },
                    
                },
                uploadSignature: async (callback: (arg: any) => void, paramsToSign: Record<string, any>) => {
                    try {
                        const res = await axios.post(`${backendBase}/api/v1/cloudinary/signature`, paramsToSign, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(localStorage.getItem('token') && {
                                    Authorization: localStorage.getItem('token') as string
                                })
                            }
                        });
                        callback({ signature: res.data.signature, timestamp: res.data.timestamp });
                    } catch (e) {
                        console.error('[Upload Widget] signing failed', e);
                    }
                }
            },
            (error: any, result: any) => {
                if (error) {
                    console.error('[Upload Widget] error', error);
                    return;
                }
                if (result?.event === 'success') {
                    const doc = mapInfoToDoc(result.info);
                    collected.current.push(doc);
                }
                if (result?.event === 'close') {
                    onComplete(collected.current);
                }
            }
        );

        widget.open();
    };

    return (
        <button
            type="button"
            onClick={openWidget}
            className="px-3 py-2 rounded-md bg-black text-white hover:bg-gray-800"
        >
            {buttonText}
        </button>
    );
}
