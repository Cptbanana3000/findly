// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const brandNameInput = document.getElementById('brandNameInput');
    const analyzeButton = document.getElementById('analyzeButton');

    analyzeButton.addEventListener('click', handleAnalysis);
    brandNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleAnalysis();
    });
});

async function handleAnalysis() {
    const brandNameInput = document.getElementById('brandNameInput');
    const brandName = brandNameInput.value.trim();
    if (!brandName) {
        document.getElementById('error-message').innerHTML = '<span>Please enter a brand name.</span>';
        return;
    }
    setupLoadingUI(brandName);
    
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const apiUrl = `/analyze-brand?brandName=${encodeURIComponent(brandName)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        const data = await response.json();
        renderResults(data);
    } catch (error) {
        handleError(error);
    }
}

function setupLoadingUI(brandName) {
    document.getElementById('error-message').innerHTML = '';
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('results-content').classList.add('hidden');
    document.getElementById('status').innerHTML = `
        <div class="flex flex-col items-center justify-center card-enhanced p-8 rounded-2xl max-w-md mx-auto">
            <div class="relative">
                <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
                <div class="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 absolute top-0 left-0"></div>
            </div>
            <div class="mt-6 text-center">
                <p class="text-xl font-semibold text-slate-800 mb-2">Analyzing "${brandName}"</p>
                <p class="text-slate-600">
                    <i class="fas fa-cogs mr-2"></i>
                    Analyzing domains, competition & SEO...
                </p>
            </div>
        </div>`;
    document.getElementById('analyzeButton').disabled = true;
    document.getElementById('analyzeButton').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
}

function handleError(error) {
    console.error('Fetch Error:', error);
    document.getElementById('status').innerHTML = `
        <div class="card-enhanced p-6 rounded-2xl border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100" role="alert">
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle text-red-500 text-2xl mr-4"></i>
                <div>
                    <p class="font-bold text-red-800 text-lg">Analysis Failed</p>
                    <p class="text-red-700">${error.message}</p>
                </div>
            </div>
        </div>`;
    resetButton();
}

function resetButton() {
    document.getElementById('analyzeButton').disabled = false;
    document.getElementById('analyzeButton').innerHTML = '<i class="fas fa-magic mr-2"></i>Analyze Brand';
}

function renderResults(data) {
    document.getElementById('status').textContent = '';
    document.getElementById('results-content').classList.remove('hidden');
    resetButton();

    renderBrandAnalysis(data);
    renderCompetitionMetrics(data.scores);
    renderDomainAnalysis(data);
    renderSocialMediaAnalysis(data);
    renderGoogleAnalysis(data);
    renderKeyInsights(data.keyInsights);
    renderDeepScanSection(data);
}

function renderBrandAnalysis({ brandName, overallScore, recommendation }) {
    const scoreColor = overallScore > 75 ? 'text-green-500' : overallScore > 50 ? 'text-yellow-500' : 'text-red-500';
    let verdictTitle;
    if (overallScore > 80) { verdictTitle = "Excellent Prospect"; }
    else if (overallScore > 60) { verdictTitle = "Strong Contender"; }
    else if (overallScore > 40) { verdictTitle = "Proceed with Caution"; }
    else { verdictTitle = "Not Recommended"; }

    const container = document.getElementById('brand-analysis-card');
    container.innerHTML = `
        <div class="flex-shrink-0">
            <div class="relative w-40 h-40">
                <svg class="w-full h-full" viewBox="0 0 100 100">
                    <circle class="text-slate-200" stroke-width="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle class="progress-circle ${scoreColor}" stroke-width="10" stroke-linecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style="transform: rotate(-90deg); transform-origin: 50% 50%; stroke-dasharray: 314; stroke-dashoffset: ${314 - (314 * overallScore) / 100};"/>
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-4xl font-bold ${scoreColor}">${overallScore}</span>
            </div>
            <p class="mt-2 text-center text-lg font-bold text-slate-800">${brandName}</p>
            <p class="text-center text-sm text-slate-500 font-medium">Overall Viability Score</p>
        </div>
        <div class="flex-grow">
            <h3 class="font-bold text-xl text-slate-800">VERDICT: <span class="${scoreColor}">${verdictTitle}</span></h3>
            <p class="mt-2 text-slate-600">${recommendation}</p>
        </div>
    `;
}

function renderCompetitionMetrics(scores) {
    const container = document.getElementById('competition-metrics-card');
    container.innerHTML = `<h3 class="text-lg font-bold text-slate-900 mb-4">Brand Metrics</h3>
        <div class="grid grid-cols-2 gap-4 text-center">
            ${createMetricCircle(scores.competitionIntensity, 'Competition')}
            ${createMetricCircle(scores.seoDifficulty, 'SEO')}
            ${createMetricCircle(scores.domainStrength, 'Domains')}
            ${createMetricCircle(scores.socialMediaAvailability, 'Social')}
        </div>`;
}

function createMetricCircle(score, label) {
    const scoreColor = score > 75 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';
    return `
        <div>
            <div class="relative w-24 h-24">
                <svg class="w-full h-full" viewBox="0 0 100 100">
                    <circle class="text-slate-200" stroke-width="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle class="progress-circle ${scoreColor}" stroke-width="8" stroke-linecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style="transform: rotate(-90deg); transform-origin: 50% 50%; stroke-dasharray: 314; stroke-dashoffset: ${314 - (314 * score) / 100};"/>
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-2xl font-bold ${scoreColor}">${score}</span>
            </div>
            <p class="mt-2 text-sm font-semibold text-slate-600">${label}</p>
        </div>`;
}

function renderDomainAnalysis({ brandName, detailedAnalysis }) {
    const container = document.getElementById('domain-analysis-card');
    const comDomain = detailedAnalysis.domainAvailability.find(d => d.domain === `${brandName}.com`);
    let alternativesHtml = detailedAnalysis.domainAvailability
        .filter(d => d.domain !== `${brandName}.com`)
        .map(d => {
            const icon = d.isAvailable ? `<i class="fas fa-check-circle text-green-500"></i>` : `<i class="fas fa-times-circle text-red-400"></i>`;
            const bgClass = d.isAvailable ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200';
            return `
                <li class="flex items-center justify-between p-3 rounded-lg border ${bgClass} transition-all duration-200 hover:scale-105">
                    <span class="font-medium text-slate-800 flex items-center">
                        <i class="fas fa-globe text-slate-400 mr-2"></i>
                        ${d.domain}
                    </span>
                    <span class="flex items-center gap-2 font-medium ${d.isAvailable ? 'text-green-600' : 'text-slate-500'}">
                        ${d.isAvailable ? 'Available' : 'Taken'} ${icon}
                    </span>
                </li>`;
        }).join('');

    const comIcon = comDomain.isAvailable ? `<i class="fas fa-check-circle text-green-500 text-xl"></i>` : `<i class="fas fa-times-circle text-red-500 text-xl"></i>`;
    const comBgClass = comDomain.isAvailable ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300' : 'bg-gradient-to-r from-red-50 to-red-100 border-red-300';

    container.innerHTML = `
        <h3 class="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <i class="fas fa-globe text-purple-600 mr-3"></i>
            Domain Analysis
        </h3>
        <div class="p-6 rounded-xl border-2 ${comBgClass} mb-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    ${comIcon}
                    <span class="font-bold text-xl text-slate-800">${comDomain.domain}</span>
                </div>
                <span class="font-bold text-lg px-4 py-2 rounded-full ${comDomain.isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">${comDomain.isAvailable ? 'Available' : 'Taken'}</span>
            </div>
        </div>
        <h4 class="text-lg font-semibold text-slate-700 mb-4 flex items-center">
            <i class="fas fa-list text-slate-500 mr-2"></i>
            Alternative Domains
        </h4>
        <ul class="space-y-3">${alternativesHtml}</ul>`;
}

function renderSocialMediaAnalysis({ brandName, detailedAnalysis }) {
    const container = document.getElementById('social-media-card');
    const socialData = detailedAnalysis.socialMediaAvailability || [];
    
    let socialHtml = '';
    if (socialData.length > 0) {
        socialHtml = socialData.map(platform => {
            const statusClass = platform.available ? 'text-green-600' : 'text-red-500';
            const statusIcon = platform.available ? 'fas fa-check-circle' : 'fas fa-times-circle';
            const statusText = platform.available ? 'Available' : 'Taken';
            const bgClass = platform.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
            
            return `
                <div class="flex items-center justify-between p-3 rounded-lg border ${bgClass} transition-all duration-200 hover:scale-105">
                    <div class="flex items-center space-x-3">
                        <i class="${platform.icon} text-lg text-slate-600"></i>
                        <div>
                            <span class="font-medium text-slate-800">${platform.platform}</span>
                            <div class="text-sm text-slate-500">${platform.handle}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="${statusIcon} ${statusClass}"></i>
                        <span class="font-medium ${statusClass}">${statusText}</span>
                    </div>
                </div>`;
        }).join('');
    } else {
        socialHtml = `
            <div class="text-center p-8 bg-yellow-50 rounded-xl border border-yellow-200">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>
                <p class="text-yellow-700 font-medium">Social media check unavailable</p>
                <p class="text-yellow-600 text-sm mt-1">Please check handles manually.</p>
            </div>`;
    }

    container.innerHTML = `
        <h3 class="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <i class="fas fa-share-alt text-purple-600 mr-3"></i>
            Social Media Handles
        </h3>
        <div class="space-y-3">${socialHtml}</div>`;
}

function renderGoogleAnalysis({ brandName, detailedAnalysis }) {
    const container = document.getElementById('google-competition-card');
    let resultsHtml = '';
    if (detailedAnalysis.googleCompetition.topResults.length > 0) {
        resultsHtml = detailedAnalysis.googleCompetition.topResults.map((item, index) => {
            const resultDomain = new URL(item.link).hostname.replace('www.', '');
            const isDirectCompetitor = resultDomain.includes(brandName);
            const tag = isDirectCompetitor ? 
                `<span class="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Direct Competitor
                </span>` : 
                `<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    #${index + 1} Result
                </span>`;
            
            return `
                <div class="border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${isDirectCompetitor ? 'bg-red-50 border-red-200' : 'bg-white'}">
                    <div class="flex items-start justify-between mb-2">
                        <a href="${item.link}" target="_blank" class="font-semibold text-blue-600 hover:underline hover:text-blue-800 transition-colors flex items-center truncate pr-4">
                            <i class="fas fa-external-link-alt mr-2 text-sm"></i>
                            ${item.title}
                        </a>
                        ${tag}
                    </div>
                    <p class="text-sm text-slate-600 leading-relaxed mb-2">${item.snippet}</p>
                    <p class="text-xs text-slate-400 flex items-center">
                        <i class="fas fa-link mr-1"></i>
                        ${resultDomain}
                    </p>
                </div>`;
        }).join('');
    } else {
        resultsHtml = `
            <div class="text-center p-8 bg-green-50 rounded-xl border border-green-200">
                <i class="fas fa-smile text-green-500 text-3xl mb-3"></i>
                <p class="text-green-700 font-medium">No significant competition found!</p>
                <p class="text-green-600 text-sm mt-1">This is a positive sign for your brand.</p>
            </div>`;
    }
    container.innerHTML = `
        <h3 class="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <i class="fas fa-search text-purple-600 mr-3"></i>
            Google Competition
        </h3>
        <div class="space-y-4">${resultsHtml}</div>`;
}

function renderKeyInsights(insights) {
    const container = document.getElementById('key-insights-card');
    container.innerHTML = insights.map(insight => {
        const isPositive = insight.type === 'positive';
        const bgClass = isPositive ? 'insight-positive' : 'insight-negative';
        const iconClass = isPositive ? 'fas fa-check-circle text-green-600' : 'fas fa-exclamation-triangle text-red-600';
        const textColor = isPositive ? 'text-green-800' : 'text-red-800';
        
        return `
            <div class="p-6 rounded-xl ${bgClass} hover:scale-105 transition-all duration-300">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center">
                        <i class="${iconClass} mr-2"></i>
                        <h4 class="font-bold text-slate-800">${insight.title}</h4>
                    </div>
                    <span class="font-bold text-sm ${textColor} bg-white/50 px-2 py-1 rounded-full">${insight.points}</span>
                </div>
                <p class="text-sm text-slate-700 leading-relaxed">${insight.description}</p>
            </div>`;
    }).join('');
}

// ===== DEEP SCAN FUNCTIONALITY =====

// Deep Scan Section Rendering
function renderDeepScanSection(data) {
    const card = document.getElementById('deep-scan-card');
    
    card.innerHTML = `
        <div class="text-center">
            <div class="flex items-center justify-center mb-6">
                <div class="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mr-4">
                    <i class="fas fa-microscope text-white text-2xl"></i>
                </div>
                <div class="text-left">
                    <h3 class="text-2xl font-bold text-slate-800">Deep Scan Analysis</h3>
                    <p class="text-slate-600">AI-powered competitive intelligence</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <i class="fas fa-spider text-purple-600 text-2xl mb-3"></i>
                    <h4 class="font-bold text-slate-800 mb-2">Web Scraping</h4>
                    <p class="text-sm text-slate-600">Extract competitor data & SEO insights</p>
                </div>
                <div class="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <i class="fas fa-brain text-blue-600 text-2xl mb-3"></i>
                    <h4 class="font-bold text-slate-800 mb-2">AI Analysis</h4>
                    <p class="text-sm text-slate-600">GPT-powered strategic recommendations</p>
                </div>
                <div class="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <i class="fas fa-chart-line text-emerald-600 text-2xl mb-3"></i>
                    <h4 class="font-bold text-slate-800 mb-2">Threat Assessment</h4>
                    <p class="text-sm text-slate-600">Competitive threat level scoring</p>
                </div>
            </div>
            
            <div id="deep-scan-content">
                <div class="flex justify-center space-x-4">
                    <button 
                        id="start-deep-scan" 
                        class="btn-primary text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300"
                        onclick="startDeepScan('${data.brandName}')"
                    >
                        <i class="fas fa-rocket mr-2"></i>
                        Launch Deep Scan
                    </button>
                    <div class="flex items-center text-slate-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                        <i class="fas fa-flask mr-2 text-amber-600"></i>
                        <span class="text-sm">Dev Mode - Free Access</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Deep Scan Functions
async function startDeepScan(brandName) {
    const button = document.getElementById('start-deep-scan');
    const content = document.getElementById('deep-scan-content');
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = `
        <i class="fas fa-spinner fa-spin mr-2"></i>
        Analyzing Competitors...
    `;
    
    // Add progress indicator
    content.innerHTML += `
        <div id="deep-scan-progress" class="mt-6 space-y-4">
            <div class="text-center">
                <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <i class="fas fa-spinner fa-spin text-blue-600 mr-2"></i>
                    <span class="text-blue-600 font-medium">Scraping competitor websites...</span>
                </div>
            </div>
            <div class="max-w-md mx-auto">
                <div class="bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full animate-pulse" style="width: 33%"></div>
                </div>
            </div>
        </div>
    `;
    
    try {
        const response = await fetch('/deep-scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ brandName })
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderDeepScanResults(result.data);
        } else {
            throw new Error(result.error || 'Deep scan failed');
        }
    } catch (error) {
        console.error('Deep scan error:', error);
        content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                <h4 class="text-lg font-bold text-slate-800 mb-2">Analysis Failed</h4>
                <p class="text-slate-600 mb-4">${error.message}</p>
                <button 
                    onclick="renderDeepScanSection({brandName: '${brandName}'})" 
                    class="text-purple-600 hover:text-purple-700 font-medium"
                >
                    Try Again
                </button>
            </div>
        `;
    }
}

function renderDeepScanResults(data) {
    const content = document.getElementById('deep-scan-content');
    
    content.innerHTML = `
        <div class="space-y-8">
            <!-- Analysis Summary -->
            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <h4 class="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <i class="fas fa-chart-bar text-purple-600 mr-3"></i>
                    Competitive Intelligence Report
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">${data.competitors?.length || 0}</div>
                        <div class="text-sm text-slate-600">Competitors Analyzed</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">${data.totalDataPoints || 0}</div>
                        <div class="text-sm text-slate-600">Data Points</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-emerald-600">${data.aiAnalysis ? '✓' : '✗'}</div>
                        <div class="text-sm text-slate-600">AI Analysis</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-amber-600">${data.timestamp ? new Date(data.timestamp).toLocaleDateString() : 'N/A'}</div>
                        <div class="text-sm text-slate-600">Generated</div>
                    </div>
                </div>
            </div>
            
            <!-- AI Analysis Results -->
            ${data.aiAnalysis ? `
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                        <h4 class="text-xl font-bold flex items-center">
                            <i class="fas fa-robot mr-3"></i>
                            AI Strategic Analysis
                        </h4>
                        <p class="text-blue-100 mt-2">Expert-level competitive intelligence powered by GPT-4</p>
                    </div>
                    <div class="p-6">
                        <div class="prose max-w-none">
                            ${formatAIAnalysis(data.aiAnalysis)}
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Competitor Data -->
            ${data.competitors && data.competitors.length > 0 ? `
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                    <div class="bg-gray-50 p-6 border-b">
                        <h4 class="text-xl font-bold text-slate-800 flex items-center">
                            <i class="fas fa-database mr-3"></i>
                            Scraped Competitor Data
                        </h4>
                    </div>
                    <div class="p-6">
                        <div class="space-y-6">
                            ${data.competitors.map(competitor => `
                                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div class="flex items-center justify-between mb-4">
                                        <h5 class="font-bold text-slate-800 flex items-center">
                                            <i class="fas fa-external-link-alt mr-2 text-blue-500"></i>
                                            ${competitor.url}
                                        </h5>
                                        <span class="px-3 py-1 rounded-full text-xs font-bold ${competitor.isSSL ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                                            ${competitor.isSSL ? 'SSL ✓' : 'No SSL ✗'}
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                        <div>
                                            <span class="text-slate-600 font-medium">Title:</span>
                                            <div class="font-medium text-slate-800">${competitor.title || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span class="text-slate-600 font-medium">Word Count:</span>
                                            <div class="font-medium text-slate-800">${competitor.wordCount || 0}</div>
                                        </div>
                                        <div>
                                            <span class="text-slate-600 font-medium">Links:</span>
                                            <div class="font-medium text-slate-800">${competitor.internalLinks || 0} int, ${competitor.externalLinks || 0} ext</div>
                                        </div>
                                        <div>
                                            <span class="text-slate-600 font-medium">Images:</span>
                                            <div class="font-medium text-slate-800">${competitor.imageCount || 0}</div>
                                        </div>
                                    </div>
                                    ${competitor.metaDescription ? `
                                        <div class="p-3 bg-gray-50 rounded text-sm">
                                            <span class="text-slate-600 font-medium">Meta Description:</span>
                                            <div class="mt-1 text-slate-700">${competitor.metaDescription}</div>
                                        </div>
                                    ` : ''}
                                    ${competitor.h1Tags && competitor.h1Tags.length > 0 ? `
                                        <div class="mt-3 p-3 bg-blue-50 rounded text-sm">
                                            <span class="text-slate-600 font-medium">H1 Tags:</span>
                                            <div class="mt-1 text-slate-700">${competitor.h1Tags.join(', ')}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <div class="text-center space-x-4">
                <button 
                    onclick="exportDeepScanReport()" 
                    class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                    <i class="fas fa-download mr-2"></i>
                    Export Report
                </button>
                <button 
                    onclick="renderDeepScanSection({brandName: '${data.brandName}'})" 
                    class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                    <i class="fas fa-redo mr-2"></i>
                    Run New Scan
                </button>
            </div>
        </div>
    `;
    
    // Scroll to results
    document.getElementById('deep-scan-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function formatAIAnalysis(analysis) {
    if (!analysis) return '';
    
    // Convert the AI analysis text to HTML with proper formatting
    return analysis
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em class="text-slate-700">$1</em>') // Italic
        .replace(/###\s(.*?)$/gm, '<h3 class="text-lg font-bold text-slate-800 mt-6 mb-3 border-l-4 border-purple-500 pl-4">$1</h3>') // H3 headers
        .replace(/##\s(.*?)$/gm, '<h2 class="text-xl font-bold text-slate-800 mt-8 mb-4 border-l-4 border-blue-500 pl-4">$1</h2>') // H2 headers
        .replace(/^\d+\.\s(.*?)$/gm, '<div class="ml-4 mb-2 flex items-start"><span class="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">•</span><span class="font-medium text-slate-800">$1</span></div>') // Numbered lists
        .replace(/^-\s(.*?)$/gm, '<div class="ml-4 mb-2 flex items-start"><span class="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span><span class="text-slate-700">$1</span></div>') // Bullet points
        .replace(/\n\n/g, '</p><p class="mb-4 text-slate-700 leading-relaxed">') // Paragraphs
        .replace(/^/, '<p class="mb-4 text-slate-700 leading-relaxed">') // Start with paragraph
        .replace(/$/, '</p>'); // End with paragraph
}

function exportDeepScanReport() {
    // This would implement report export functionality
    // For now, show a placeholder
    alert('📊 Report export feature coming soon!\n\nThis will generate a professional PDF report with:\n• AI analysis summary\n• Competitor data tables\n• Strategic recommendations\n• Threat assessment matrix');
}
