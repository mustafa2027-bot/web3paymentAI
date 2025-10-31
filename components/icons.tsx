import React from 'react';

export const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export const EthIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.0001 12.8236L17.5133 10.0278L12.0001 3.99976L6.48682 10.0278L12.0001 12.8236Z" fill="currentColor"/>
    <path d="M12.0001 13.842L6.48682 11.0462L12.0001 19.9998L17.5133 11.0462L12.0001 13.842Z" fill="currentColor" fillOpacity="0.6"/>
  </svg>
);

export const PolygonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.28713 6.9421L4 12.0001L8.03153 14.1554L6.28713 6.9421Z" fill="currentColor"/>
    <path d="M9.13529 15.6133L8.03149 14.1555L4 12.0001L8.45569 18.0001L9.13529 15.6133Z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M9.9912 17.0691L8.45565 18.0001L12.0001 20.0001L13.1557 15.1114L9.9912 17.0691Z" fill="currentColor"/>
    <path d="M14.2255 14.2842L13.1557 15.1114L12.0001 20.0001L15.9084 17.5501L14.2255 14.2842Z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M15.9084 17.55L19.9999 12.0001L17.721 6.9668L15.9084 17.55Z" fill="currentColor"/>
    <path d="M14.896 12.9246L15.9084 17.5501L19.9999 12.0001L14.896 12.9246Z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M13.8184 9.17757L17.721 6.9668L12.0001 4L9.88091 9.60105L13.8184 9.17757Z" fill="currentColor"/>
    <path d="M9.88089 9.60109L8.03149 14.1555L9.13529 15.6133L13.1557 15.1114L14.2255 14.2842L14.896 12.9246L13.8184 9.17761L9.88089 9.60109Z" fill="currentColor" fillOpacity="0.2"/>
  </svg>
);

export const BnbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L6 5.25L12 8.5L18 5.25L12 2Z" fill="currentColor"/>
      <path d="M6 18.75L12 22L18 18.75V12.25L12 15.5L6 12.25V18.75Z" fill="currentColor"/>
      <path d="M18 5.25L12 8.5V15.5L18 12.25V5.25Z" fill="currentColor" fillOpacity="0.6"/>
      <path d="M6 5.25V12.25L12 15.5V8.5L6 5.25Z" fill="currentColor" fillOpacity="0.3"/>
    </svg>
);

export const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M19 3v4M17 5h4M12 19v4M10 21h4M5 19v-4M3 17h4M19 19v-4M17 17h4M12 3v4M10 5h4" />
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
