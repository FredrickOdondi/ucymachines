import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

function EmsAutomation() {
    const { theme } = useTheme();
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [loadingPersistedData, setLoadingPersistedData] = useState(true);
    const [selectedPositions, setSelectedPositions] = useState({
        CEO: true,
        COO: false,
        CFO: false,
        CTO: false,
        CSCO: false,
        CMO: false,
        "Plant Manager": false,
        "Director of Operations": false,
        "Director of Manufacturing": false,
    });
    const [searchFilter, setSearchFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [processingStats, setProcessingStats] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);
    const [europeOnly, setEuropeOnly] = useState(true);

    // European countries list
    const europeanCountries = new Set([
        'Germany', 'Austria', 'Switzerland', 'United Kingdom', 'UK', 'Great Britain',
        'France', 'Netherlands', 'Belgium', 'Luxembourg', 'Poland', 'Czech Republic',
        'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Italy', 'Spain', 'Portugal',
        'Greece', 'Croatia', 'Slovenia', 'Serbia', 'Sweden', 'Norway', 'Denmark',
        'Finland', 'Iceland', 'Ireland', 'Estonia', 'Latvia', 'Lithuania', 'Europe'
    ]);

    // Poll database stats while processing LinkedIn search
    useEffect(() => {
        let intervalId;
        if (loading) {
            intervalId = setInterval(async () => {
                try {
                    const response = await fetch('http://localhost:8000/database/stats');
                    if (response.ok) {
                        const data = await response.json();
                        setProcessingStats(data);
                    }
                } catch (error) {
                    console.log('Stats polling error:', error);
                }
            }, 1000); // Poll every 1 second for faster updates
        } else {
            setProcessingStats(null); // Clear stats when not loading
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [loading]);

    // Load persisted companies from database on component mount
    useEffect(() => {
        const loadPersistedData = async () => {
            try {
                const response = await fetch('http://localhost:8000/database/companies');
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setCompanies(data);

                        // Apply Europe filter on load
                        const filtered = europeOnly
                            ? data.filter(c => europeanCountries.has(c.country))
                            : data;

                        setFilteredCompanies(filtered);
                        const europeCount = data.filter(c => europeanCountries.has(c.country)).length;
                        setStatus(`✓ Loaded ${data.length} companies (${europeCount} European)`);
                    }
                }
            } catch (error) {
                console.log('Info: No persisted data found - this is normal on first run');
            } finally {
                setLoadingPersistedData(false);
            }
        };

        loadPersistedData();
    }, []);

    const TARGET_POSITIONS = [
        "CEO", "COO", "CFO", "CTO", "CSCO", "CMO",
        "Plant Manager", "Director of Operations", "Director of Manufacturing",
        "Director of Production", "VP Manufacturing", "Head of Facilities"
    ];

    const handleStartScraping = async () => {
        setLoading(true);
        setStatus('Scraping EMS companies from all sources...');

        try {
            const response = await fetch('http://localhost:8000/ems/scrape', {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Scraping failed');

            const data = await response.json();
            const allCompanies = data.companies || [];

            setCompanies(allCompanies);

            // Apply Europe filter
            const filtered = europeOnly
                ? allCompanies.filter(c => europeanCountries.has(c.country))
                : allCompanies;

            setFilteredCompanies(filtered);

            const europeCount = allCompanies.filter(c => europeanCountries.has(c.country)).length;
            setStatus(`✓ Found ${allCompanies.length} companies (${europeCount} European)`);
        } catch (error) {
            setStatus(`✗ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchLinkedIn = async () => {
        if (companies.length === 0) {
            setStatus('Please scrape companies first');
            return;
        }

        setLoading(true);
        setStatus('Searching LinkedIn profiles...');

        try {
            const positions = Object.keys(selectedPositions).filter(p => selectedPositions[p]);
            
            const response = await fetch('http://localhost:8000/ems/linkedin-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companies: filteredCompanies,
                    positions: positions.length > 0 ? positions : ['CEO']
                })
            });

            if (!response.ok) throw new Error('LinkedIn search failed');

            const data = await response.json();
            const allCompanies = data.companies || [];

            setCompanies(allCompanies);

            // Apply Europe filter
            const filtered = europeOnly
                ? allCompanies.filter(c => europeanCountries.has(c.country))
                : allCompanies;

            setFilteredCompanies(filtered);

            let statusMsg = `✓ Search complete - ${data.total_profiles_found || 0} profiles found`;
            if (data.limited) {
                statusMsg += ` (searched ${data.companies_searched}/${data.total_companies} companies)`;
            }
            setStatus(statusMsg);
        } catch (error) {
            setStatus(`✗ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ['Company Name', 'Country', 'Source', 'Total Profiles', 'Profiles (Name | Position | LinkedIn URL)'];
        const rows = filteredCompanies.map(c => {
            const profilesText = c.profiles_found?.map(p => 
                `${p.name || 'N/A'} | ${p.position || 'N/A'} | ${p.url || 'N/A'}`
            ).join('; ') || 'No profiles';
            
            return [
                c.company_name || c.name,
                c.country || '',
                c.source || '',
                c.total_profiles || 0,
                profilesText
            ];
        });

        const csv = [headers, ...rows].map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ems-companies-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const applyFilters = () => {
        let filtered = companies;

        // Filter by European countries only
        if (europeOnly) {
            filtered = filtered.filter(c => europeanCountries.has(c.country));
        }

        if (searchFilter) {
            filtered = filtered.filter(c =>
                (c.company_name || c.name).toLowerCase().includes(searchFilter.toLowerCase())
            );
        }

        if (countryFilter) {
            filtered = filtered.filter(c => c.country === countryFilter);
        }

        setFilteredCompanies(filtered);
        setCurrentPage(1); // Reset to page 1 when filters change
    };

    // Calculate pagination
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

    const uniqueCountries = [...new Set(companies.map(c => c.country || ''))].filter(Boolean);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
                <h2 className={'text-xl lg:text-2xl font-bold ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>EMS Company Automation</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleStartScraping}
                        disabled={loading}
                        className="flex-1 sm:flex-none bg-cyan-600 hover:bg-primary-500 px-3 lg:px-4 py-2 rounded text-xs lg:text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Scraping...' : 'Scrape Companies'}
                    </button>
                    <button
                        onClick={handleSearchLinkedIn}
                        disabled={loading || companies.length === 0}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 px-3 lg:px-4 py-2 rounded text-xs lg:text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search LinkedIn'}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={filteredCompanies.length === 0}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 px-3 lg:px-4 py-2 rounded text-xs lg:text-sm font-medium disabled:opacity-50"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {status && (
                <div className={'p-4 rounded border ' + (status.startsWith('✓') ? 'border-green-500 bg-success-500/10 text-success-500' : 'border-red-500 bg-red-500/10 text-red-400')}>
                    {status}
                </div>
            )}

            {processingStats && processingStats.companies_processed > 0 && (
                <div className={'p-4 rounded border border-blue-500 bg-blue-500/10 text-blue-400'}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">🔄 Processing Progress:</span>
                        <span className="text-lg font-bold">
                            {processingStats.companies_processed} / {processingStats.total_companies} companies processed
                        </span>
                    </div>
                    <div className="mt-2 text-sm">
                        {processingStats.linkedin_profiles} LinkedIn profiles found
                    </div>
                </div>
            )}

            {/* Controls Section */}
            <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4 rounded-xl p-4 lg:p-6 ' + (theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100')}>
                <div className="md:col-span-2 lg:col-span-4">
                    <label className={'block text-sm font-medium mb-2 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Search Company</label>
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        onKeyUp={applyFilters}
                        placeholder="Filter by company name..."
                        className={'w-full px-3 py-2 rounded text-sm ' + (theme === 'dark' ? 'bg-zinc-900 border border-slate-600 text-white placeholder-slate-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500')}
                    />
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                    <label className={'block text-sm font-medium mb-2 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Country Filter</label>
                    <select
                        value={countryFilter}
                        onChange={(e) => { setCountryFilter(e.target.value); applyFilters(); }}
                        className={'w-full px-3 py-2 rounded text-sm ' + (theme === 'dark' ? 'bg-zinc-900 border border-slate-600 text-white' : 'bg-white border border-gray-300 text-gray-900')}
                    >
                        <option value="">All Countries</option>
                        {uniqueCountries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                    <label className={'block text-sm font-medium mb-2 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Results</label>
                    <div className={'px-3 py-2 border rounded text-sm text-primary-400 ' + (theme === 'dark' ? 'bg-zinc-900 border-slate-600' : 'bg-white border-gray-300')}>
                        {filteredCompanies.length} companies
                    </div>
                </div>

                <div className="md:col-span-2 lg:col-span-12 flex items-center gap-4">
                    <label className={'flex items-center cursor-pointer ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        <input
                            type="checkbox"
                            checked={europeOnly}
                            onChange={(e) => { setEuropeOnly(e.target.checked); applyFilters(); }}
                            className="mr-2 rounded"
                        />
                        <span className="text-sm font-medium">🇪🇪 Europe Only (filter out USA/International)</span>
                    </label>
                </div>

                <div className="md:col-span-2 lg:col-span-12">
                    <label className={'block text-sm font-medium mb-3 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Target Positions</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3">
                        {TARGET_POSITIONS.map(position => (
                            <label key={position} className={'flex items-center text-xs sm:text-sm cursor-pointer ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                <input
                                    type="checkbox"
                                    checked={selectedPositions[position] || false}
                                    onChange={(e) => setSelectedPositions({
                                        ...selectedPositions,
                                        [position]: e.target.checked
                                    })}
                                    className="mr-2 rounded"
                                />
                                <span className="truncate">{position}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className={'rounded-xl overflow-hidden ' + (theme === 'dark' ? 'bg-zinc-900' : 'bg-white')}>
                {filteredCompanies.length === 0 ? (
                    <div className={'p-8 text-center ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                        No companies found. Start by scraping EMS companies.
                    </div>
                ) : (
                    <>
                        <div className="space-y-0">
                            {paginatedCompanies.map((company) => (
                            <div key={company.company_name || company.name || company.source} className={'border-b transition p-4 ' + (theme === 'dark' ? 'border-slate-700 hover:bg-zinc-900/30' : 'border-gray-200 hover:bg-gray-100')}>
                                {/* Company Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className={'font-bold text-base ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>{company.company_name || company.name}</h3>
                                        <div className={'flex gap-4 mt-1 text-xs ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                                            <span>📍 {company.country || '-'}</span>
                                            <span>🔗 {company.source || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={'inline-block px-3 py-1 rounded-full text-sm font-medium ' + ((company.total_profiles || 0) > 0 ? 'bg-green-500/20 text-success-500' : theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-600')}>
                                            {company.total_profiles || 0} profiles
                                        </div>
                                    </div>
                                </div>

                                {/* LinkedIn Contacts List */}
                                {company.profiles_found && company.profiles_found.length > 0 ? (
                                    <div className="mt-3 space-y-2 pl-0">
                                        {company.profiles_found.map((profile, pIdx) => (
                                            <div key={pIdx} className={'flex items-start gap-3 rounded p-2.5 ' + (theme === 'dark' ? 'bg-zinc-900/40' : 'bg-gray-100')}>
                                                <div className="flex-1 min-w-0">
                                                    <a
                                                        href={profile.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 hover:underline font-medium text-sm break-words"
                                                        title={`Open ${profile.name}'s LinkedIn profile`}
                                                    >
                                                        {profile.name || 'Unknown'}
                                                    </a>
                                                    <div className={'text-xs mt-0.5 ' + (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                                                        {profile.position}
                                                    </div>
                                                    <div className={'text-xs mt-1 truncate ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>
                                                        {profile.url}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => window.open(profile.url, '_blank')}
                                                    className="flex-shrink-0 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium text-white transition"
                                                    title="Open LinkedIn profile"
                                                >
                                                    Visit
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={'text-sm italic mt-2 ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>No LinkedIn profiles found for selected positions</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className={'flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t ' + (theme === 'dark' ? 'border-slate-700' : 'border-gray-200')}>
                            <div className={'text-sm ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                                Showing {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} of {filteredCompanies.length} companies
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className={'px-3 py-1 rounded text-sm font-medium disabled:opacity-50 ' + (theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={'px-3 py-1 rounded text-sm font-medium disabled:opacity-50 ' + (theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        // Show first, last, current, and adjacent pages
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={'px-3 py-1 rounded text-sm font-medium ' + (
                                                        currentPage === pageNum
                                                            ? 'bg-blue-600 text-white'
                                                            : (theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                                    )}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return (
                                                        <span key={pageNum} className={'px-2 py-1 text-sm ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={'px-3 py-1 rounded text-sm font-medium disabled:opacity-50 ' + (theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={'px-3 py-1 rounded text-sm font-medium disabled:opacity-50 ' + (theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
}

export default EmsAutomation;
