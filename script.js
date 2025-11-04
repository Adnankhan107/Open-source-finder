// GitHub API Configuration
const GITHUB_API = 'https://api.github.com/search/repositories';
let currentQuery = 'stars:>100'; // Default query to show popular repos

// DOM Elements
const searchForm = document.querySelector('form');
const searchInput = document.querySelector('input[name="query"]');
const languageFilter = document.getElementById('language');
const starsFilter = document.getElementById('stars');
const issuesFilter = document.getElementById('issues');
const updatedFilter = document.getElementById('updated');
const resultsContainer = document.querySelector('.results-container');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  fetchRepositories();
  
  // Event listeners
  searchForm.addEventListener('submit', handleSearch);
  languageFilter.addEventListener('change', applyFilters);
  starsFilter.addEventListener('change', applyFilters);
  issuesFilter.addEventListener('change', applyFilters);
  updatedFilter.addEventListener('change', applyFilters);
});

// Handle search submission
function handleSearch(e) {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    currentQuery = query;
    applyFilters();
  }
}

// Apply all filters and fetch repositories
function applyFilters() {
  let query = currentQuery;
  
  // Add language filter
  const language = languageFilter.value;
  if (language) {
    query += ` language:${language}`;
  }
  
  // Add stars filter
  const stars = starsFilter.value;
  if (stars) {
    query += ` stars:${stars}`;
  }
  
  // Add issues filter
  const issues = issuesFilter.value;
  if (issues) {
    query += ` good-first-issues:${issues}`;
  }
  
  // Add updated filter
  const updated = updatedFilter.value;
  if (updated) {
    const date = getDateFromFilter(updated);
    query += ` pushed:>${date}`;
  }
  
  fetchRepositories(query);
}

// Convert filter value to date string
function getDateFromFilter(filter) {
  const now = new Date();
  switch (filter) {
    case 'week':
      now.setDate(now.getDate() - 7);
      break;
    case 'month':
      now.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now.toISOString().split('T')[0];
}

// Fetch repositories from GitHub API
async function fetchRepositories(query = 'stars:>100') {
  showLoading();
  
  try {
    const url = `${GITHUB_API}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const data = await response.json();
    displayRepositories(data.items);
  } catch (error) {
    showError(error.message);
  }
}

// Display repositories in the grid
function displayRepositories(repos) {
  if (!repos || repos.length === 0) {
    resultsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #8b949e;">
        <h3>No repositories found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
    return;
  }
  
  resultsContainer.innerHTML = repos.map(repo => createRepoCard(repo)).join('');
}

// Create a repository card HTML
function createRepoCard(repo) {
  const stars = formatNumber(repo.stargazers_count);
  const issues = formatNumber(repo.open_issues_count);
  const language = repo.language || 'Unknown';
  const updated = getTimeAgo(repo.updated_at);
  const description = repo.description || 'No description available';
  
  return `
    <div class="repo-card">
      <div class="repo-header">
        <h3 class="repo-name">${repo.name}</h3>
        <a href="${repo.html_url}" class="repo-link" target="_blank" rel="noopener">View on GitHub</a>
      </div>
      <p class="repo-description">${escapeHtml(description)}</p>
      <div class="repo-stats">
        <span>⭐ ${stars}</span>
        <span>🐞 ${issues} Issues</span>
        <span>💻 ${language}</span>
        <span>⏰ Updated ${updated}</span>
      </div>
    </div>
  `;
}

// Show loading state
function showLoading() {
  resultsContainer.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #8b949e;">
      <h3>Loading repositories...</h3>
    </div>
  `;
}

// Show error message
function showError(message) {
  resultsContainer.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #f85149;">
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

// Utility: Format numbers (e.g., 1000 -> 1k)
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// Utility: Get relative time (e.g., "3 days ago")
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}