// Modern Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Rotate toggle icon
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-right';
            } else {
                icon.className = 'fas fa-chevron-left';
            }
        });
    }

    // Mobile Menu Toggle
    const menuButton = document.querySelector('.mobile-menu-button');
    if (menuButton && sidebar) {
        menuButton.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Initialize Charts
    initializeCharts();
    
    // Time Period Tab Functionality
    setupTimeTabs();
});

// Initialize Charts
function initializeCharts() {
    // Revenue Overview Chart (Attendance Overview)
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        // Fixed light mode colors
        const textColor = '#64748B';
        const gridColor = '#E2E8F0';
        
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Attendance Rate',
                    data: [65, 72, 68, 85, 92, 88, 95],
                    borderColor: '#0052FF',
                    backgroundColor: createGradient(revenueCtx, '#0052FF'),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#0052FF',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 13,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 14,
                            weight: '600'
                        },
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 12
                            }
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        border: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // User Activity Chart
    const userActivityCtx = document.getElementById('userActivityChart');
    if (userActivityCtx) {
        // Fixed light mode colors
        const textColor = '#64748B';
        const gridColor = '#E2E8F0';
        
        new Chart(userActivityCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [
                    {
                        label: 'Active Users',
                        data: [5200, 5500, 5800, 6100, 6300, 6500, 6800],
                        backgroundColor: '#0052FF',
                        borderRadius: 8,
                        borderSkipped: false
                    },
                    {
                        label: 'New Users',
                        data: [1200, 1400, 1300, 1600, 1500, 1700, 1800],
                        backgroundColor: '#06B6D4',
                        borderRadius: 8,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 13,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 14,
                            weight: '600'
                        },
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 12
                            }
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return (value / 1000) + 'k';
                            }
                        },
                        border: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

// Create gradient for area chart
function createGradient(ctx, color) {
    const canvas = ctx.canvas;
    const gradient = canvas.getContext('2d').createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, hexToRgba(color, 0.3));
    gradient.addColorStop(1, hexToRgba(color, 0));
    return gradient;
}

// Convert hex to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Time Period Tabs
function setupTimeTabs() {
    const timeTabs = document.querySelectorAll('.time-tab');
    
    timeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            timeTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Here you can add AJAX call to fetch data for the selected period
            const period = this.textContent;
            console.log('Selected period:', period);
            
            // Update charts with new data
            // updateCharts(period);
        });
    });
}

// Update charts with new data (implement as needed)
function updateCharts(period) {
    // Implement AJAX call to backend to fetch data for the period
    // Then update the charts
    console.log('Updating charts for period:', period);
}

// Animate progress bars on scroll
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            }
        });
    });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// Initialize animations
animateProgressBars();

// Animate stat values on load
function animateStatValues() {
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
        const text = stat.textContent;
        const hasPercent = text.includes('%');
        const hasDollar = text.includes('$');
        const numericValue = parseFloat(text.replace(/[^0-9.]/g, ''));
        
        if (!isNaN(numericValue)) {
            animateValue(stat, 0, numericValue, 1000, hasPercent, hasDollar);
        }
    });
}

// Animate number counting
function animateValue(element, start, end, duration, hasPercent, hasDollar) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;
        
        let displayValue = Math.floor(value).toLocaleString();
        if (hasDollar) displayValue = '$' + displayValue;
        if (hasPercent) displayValue = displayValue + '%';
        
        element.textContent = displayValue;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// Run animations on page load
setTimeout(animateStatValues, 300);

// Smooth scroll for navigation
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', function(e) {
        // Add smooth transition effect
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });
});

// Add loading state to buttons
document.querySelectorAll('.btn, .icon-button').forEach(button => {
    button.addEventListener('click', function() {
        if (!this.classList.contains('loading')) {
            const originalContent = this.innerHTML;
            this.classList.add('loading');
            this.disabled = true;
            
            // Simulate loading (remove in production)
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
                this.innerHTML = originalContent;
            }, 1000);
        }
    });
});
