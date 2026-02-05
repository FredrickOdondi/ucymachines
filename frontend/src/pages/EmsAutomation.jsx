import React, { useState, useEffect } from 'react';

function EmsAutomation() {
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

    // Load persisted companies from database on component mount
    useEffect(() => {
        const loadPersistedData = async () => {
            try {
                const response = await fetch('http://localhost:8000/database/companies');
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setCompanies(data);
                        setFilteredCompanies(data);
                        setStatus(`✓ Loaded ${data.length} companies from database`);
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
            setCompanies(data.companies || []);
            setFilteredCompanies(data.companies || []);
            setStatus(`✓ Found ${data.companies?.length || 0} companies`);
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
            setCompanies(data.companies || []);
            setFilteredCompanies(data.companies || []);
            
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

        if (searchFilter) {
            filtered = filtered.filter(c =>
                (c.company_name || c.name).toLowerCase().includes(searchFilter.toLowerCase())
            );
        }

        if (countryFilter) {
            filtered = filtered.filter(c => c.country === countryFilter);
        }

        setFilteredCompanies(filtered);
    };

    const uniqueCountries = [...new Set(companies.map(c => c.country || ''))].filter(Boolean);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">EMS Company Automation</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleStartScraping}
                        disabled={loading}
                        className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Scraping...' : 'Scrape Companies'}
                    </button>
                    <button
                        onClick={handleSearchLinkedIn}
                        disabled={loading || companies.length === 0}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search LinkedIn'}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={filteredCompanies.length === 0}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                    >
                        Export to CSV
                    </button>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded border ${status.startsWith('✓') ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400'}`}>
                    {status}
                </div>
            )}

            {companies.length > 50 && (
                <div className="p-4 rounded border border-yellow-500 bg-yellow-500/10 text-yellow-400 text-sm">
                    ⚠️ Showing first 50 companies for performance. Total companies available: {companies.length}
                </div>
            )}

            {/* Controls Section */}
            <div className="grid grid-cols-12 gap-4 bg-slate-900 border border-slate-700 rounded-xl p-6">
                <div className="col-span-4">
                    <label className="block text-sm font-medium mb-2">Search Company</label>
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        onKeyUp={applyFilters}
                        placeholder="Filter by company name..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white placeholder-slate-500"
                    />
                </div>

                <div className="col-span-4">
                    <label className="block text-sm font-medium mb-2">Country Filter</label>
                    <select
                        value={countryFilter}
                        onChange={(e) => { setCountryFilter(e.target.value); applyFilters(); }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                    >
                        <option value="">All Countries</option>
                        {uniqueCountries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-4">
                    <label className="block text-sm font-medium mb-2">Results</label>
                    <div className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-cyan-400">
                        {filteredCompanies.length} companies
                    </div>
                </div>

                <div className="col-span-12">
                    <label className="block text-sm font-medium mb-3">Target Positions</label>
                    <div className="grid grid-cols-6 gap-3">
                        {TARGET_POSITIONS.map(position => (
                            <label key={position} className="flex items-center text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedPositions[position] || false}
                                    onChange={(e) => setSelectedPositions({
                                        ...selectedPositions,
                                        [position]: e.target.checked
                                    })}
                                    className="mr-2 rounded"
                                />
                                {position}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                {filteredCompanies.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No companies found. Start by scraping EMS companies.
                    </div>
                ) : (
                    <div className="space-y-0">
                        {filteredCompanies.slice(0, 50).map((company, idx) => (
                            <div key={idx} className="border-b border-slate-700 hover:bg-slate-800/30 transition p-4">
                                {/* Company Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-base">{company.company_name || company.name}</h3>
                                        <div className="flex gap-4 mt-1 text-xs text-slate-400">
                                            <span>📍 {company.country || '-'}</span>
                                            <span>🔗 {company.source || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                            (company.total_profiles || 0) > 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                                        }`}>
                                            {company.total_profiles || 0} profiles
                                        </div>
                                    </div>
                                </div>

                                {/* LinkedIn Contacts List */}
                                {company.profiles_found && company.profiles_found.length > 0 ? (
                                    <div className="mt-3 space-y-2 pl-0">
                                        {company.profiles_found.map((profile, pIdx) => (
                                            <div key={pIdx} className="flex items-start gap-3 bg-slate-800/40 rounded p-2.5">
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
                                                    <div className="text-slate-300 text-xs mt-0.5">
                                                        {profile.position}
                                                    </div>
                                                    <div className="text-slate-500 text-xs mt-1 truncate">
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
                                    <div className="text-slate-500 text-sm italic mt-2">No LinkedIn profiles found for selected positions</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmsAutomation;
