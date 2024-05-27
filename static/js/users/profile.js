// const allData = {
//     labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//     datasets: [{
//         label: 'Games Played',
//         data: [65, 59, 80, 81, 56, 55, 40],
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//         borderColor: 'rgba(75, 192, 192, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Wins',
//         data: [28, 48, 40, 19, 86, 27, 90],
//         backgroundColor: 'rgba(54, 162, 235, 0.6)',
//         borderColor: 'rgba(54, 162, 235, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Losses',
//         data: [12, 35, 45, 50, 55, 40, 30],
//         backgroundColor: 'rgba(255, 99, 132, 0.6)',
//         borderColor: 'rgba(255, 99, 132, 1)',
//         borderWidth: 1
//     }]
// };

// const monthlyData = {
//     labels: ['January', 'February', 'March'],
//     datasets: [{
//         label: 'Games Played',
//         data: [65, 59, 80],
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//         borderColor: 'rgba(75, 192, 192, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Wins',
//         data: [28, 48, 40],
//         backgroundColor: 'rgba(54, 162, 235, 0.6)',
//         borderColor: 'rgba(54, 162, 235, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Losses',
//         data: [12, 35, 45],
//         backgroundColor: 'rgba(255, 99, 132, 0.6)',
//         borderColor: 'rgba(255, 99, 132, 1)',
//         borderWidth: 1
//     }]
// };

// const weeklyData = {
//     labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
//     datasets: [{
//         label: 'Games Played',
//         data: [15, 20, 25, 30],
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//         borderColor: 'rgba(75, 192, 192, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Wins',
//         data: [8, 12, 15, 18],
//         backgroundColor: 'rgba(54, 162, 235, 0.6)',
//         borderColor: 'rgba(54, 162, 235, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Losses',
//         data: [7, 8, 10, 12],
//         backgroundColor: 'rgba(255, 99, 132, 0.6)',
//         borderColor: 'rgba(255, 99, 132, 1)',
//         borderWidth: 1
//     }]
// };

// const dailyData = {
//     labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
//     datasets: [{
//         label: 'Games Played',
//         data: [10, 12, 14, 16, 18, 20, 22],
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//         borderColor: 'rgba(75, 192, 192, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Wins',
//         data: [5, 6, 7, 8, 9, 10, 11],
//         backgroundColor: 'rgba(54, 162, 235, 0.6)',
//         borderColor: 'rgba(54, 162, 235, 1)',
//         borderWidth: 1
//     }, {
//         label: 'Losses',
//         data: [5, 6, 7, 8, 9, 10, 11],
//         backgroundColor: 'rgba(255, 99, 132, 0.6)',
//         borderColor: 'rgba(255, 99, 132, 1)',
//         borderWidth: 1
//     }]
// };

// let currentChart;
// let currentData = allData;

// document.addEventListener('DOMContentLoaded', function() {
//     const ctx = document.getElementById('gameStatsChart').getContext('2d');
//     currentChart = new Chart(ctx, {
//         type: 'bar',
//         data: currentData,
//         options: {
//             responsive: true,
//             scales: {
//                 x: {
//                     display: true,
//                     title: {
//                         display: true,
//                         text: 'Time',
//                         color: 'var(--text-color)'
//                     },
//                     ticks: {
//                         color: 'var(--text-color)'
//                     }
//                 },
//                 y: {
//                     display: true,
//                     title: {
//                         display: true,
//                         text: 'Number of Games',
//                         color: 'var(--text-color)'
//                     },
//                     ticks: {
//                         color: 'var(--text-color)'
//                     }
//                 }
//             },
//             plugins: {
//                 legend: {
//                     labels: {
//                         color: 'var(--text-color)'
//                     }
//                 }
//             }
//         }
//     });
// });

// function updateChart(filter) {
//     if (filter === 'all') {
//         currentData = allData;
//     } else if (filter === 'monthly') {
//         currentData = monthlyData;
//     } else if (filter === 'weekly') {
//         currentData = weeklyData;
//     } else if (filter === 'daily') {
//         currentData = dailyData;
//     }

//     currentChart.data = currentData;
//     currentChart.update();
// }

// function changeChartType() {
//     const chartType = document.getElementById('chartType').value;
//     currentChart.destroy();

//     const ctx = document.getElementById('gameStatsChart').getContext('2d');
//     currentChart = new Chart(ctx, {
//         type: chartType,
//         data: currentData,
//         options: {
//             responsive: true,
//             scales: {
//                 x: {
//                     display: true,
//                     title: {
//                         display: true,
//                         text: 'Time',
//                         color: 'var(--text-color)'
//                     },
//                     ticks: {
//                         color: 'var(--text-color)'
//                     }
//                 },
//                 y: {
//                     display: true,
//                     title: {
//                         display: true,
//                         text: 'Number of Games',
//                         color: 'var(--text-color)'
//                     },
//                     ticks: {
//                         color: 'var(--text-color)'
//                     }
//                 }
//             },
//             plugins: {
//                 legend: {
//                     labels: {
//                         color: 'var(--text-color)'
//                     }
//                 }
//             }
//         }
//     });
// }


