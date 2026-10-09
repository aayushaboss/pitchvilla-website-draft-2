'use client';
import dynamic from 'next/dynamic';

export default dynamic(() => import('./Apply'), { ssr: false });
