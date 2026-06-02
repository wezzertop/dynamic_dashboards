/** @odoo-module **/

import { Component, useState, onWillStart, onMounted, useRef, onPatched } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export class ChartWidget extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.canvasRef = useRef("canvas");
        this.chartInstance = null;
        
        this.state = useState({
            loading: true,
            data: {}
        });
        
        this.lastDateFilter = this.props.dateFilter;
        this.lastDarkMode = this.props.darkMode;

        onWillStart(async () => {
            await this.fetchData();
        });

        onMounted(() => {
            this.renderChart();
        });

        onPatched(() => {
            let reRender = false;
            if (this.props.dateFilter !== this.lastDateFilter) {
                this.lastDateFilter = this.props.dateFilter;
                reRender = true;
            }
            if (this.props.darkMode !== this.lastDarkMode) {
                this.lastDarkMode = this.props.darkMode;
                reRender = true;
            }
            
            if (reRender && this.props.dateFilter !== this.lastDateFilter) {
                 // dateFilter triggers fetch
                 this.fetchData().then(() => this.renderChart());
            } else if (reRender) {
                 // darkMode just triggers re-render
                 this.renderChart();
            }
        });
    }

    async fetchData() {
        if (this.props.previewData) {
            this.state.data = this.props.previewData;
            this.state.loading = false;
            return;
        }

        this.state.loading = true;
        try {
            const result = await this.orm.call(
                "dynamic.dashboard.item",
                "fetch_dashboard_data",
                [this.props.item.id, this.props.dateFilter]
            );
            this.state.data = result;
        } catch (e) {
            console.error("Error fetching chart data", e);
        } finally {
            this.state.loading = false;
        }
    }

    formatNumber(num) {
        if (!num) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "k";
        return num.toFixed(2);
    }

    async onChartClick(index) {
        if (!this.state.data.labels || !this.state.data.labels[index]) return;
        const label = this.state.data.labels[index];
        
        try {
            const action = await this.orm.call(
                "dynamic.dashboard.item",
                "get_action_for_drilldown",
                [this.props.item.id, label, this.props.dateFilter || 'all']
            );
            if (action) {
                this.action.doAction(action);
            }
        } catch (e) {
            console.error("Drill-down failed", e);
        }
    }

    async onEditChart() {
        if (!this.props.item || !this.props.item.id) return;
        
        this.action.doAction({
            type: 'ir.actions.act_window',
            res_model: 'dynamic.dashboard.item',
            res_id: this.props.item.id,
            views: [[false, 'form']],
            target: 'new',
            name: _t("Edit Chart Settings"),
        }, {
            onClose: () => {
                window.location.reload();
            }
        });
    }

    renderChart() {
        if (this.props.item.chart_type === 'kpi' || this.props.item.chart_type === 'list' || !this.state.data.labels || this.state.data.labels.length === 0) {
            return;
        }

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const ctx = this.canvasRef.el;
        if (!ctx) return;

        const type = this.props.item.chart_type;
        const labels = this.state.data.labels || [];
        const data = this.state.data.data || [];

        // Colors
        const backgroundColors = [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
        ];

        let chartJsType = type;
        let fillArea = false;
        if (chartJsType === 'area') {
            chartJsType = 'line';
            fillArea = true;
        }

        const config = {
            type: chartJsType,
            data: {
                labels: labels,
                datasets: [{
                    label: this.props.item.name,
                    data: data,
                    backgroundColor: chartJsType === 'line' ? 'rgba(54, 162, 235, 0.2)' : backgroundColors,
                    borderColor: chartJsType === 'line' ? 'rgba(54, 162, 235, 1)' : backgroundColors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1,
                    fill: fillArea,
                    tension: 0.4
                }]
            },
            options: {
                onClick: (event, elements, chart) => {
                    if (elements && elements.length > 0) {
                        const index = elements[0].index;
                        this.onChartClick(index);
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: ['pie', 'doughnut'].includes(chartJsType),
                        position: 'right',
                        labels: {
                            color: this.props.darkMode ? '#fff' : '#666'
                        }
                    }
                },
                scales: ['pie', 'doughnut', 'radar', 'polarArea'].includes(chartJsType) ? {} : {
                    x: {
                        ticks: { color: this.props.darkMode ? '#aaa' : '#666' },
                        grid: { color: this.props.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    },
                    y: {
                        ticks: { color: this.props.darkMode ? '#aaa' : '#666' },
                        grid: { color: this.props.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        };

        this.chartInstance = new Chart(ctx, config);
    }

    downloadChart() {
        if (!this.chartInstance) return;
        const url = this.chartInstance.toBase64Image();
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.props.item.name}.png`;
        a.click();
    }

    downloadCsv() {
        if (this.props.item.chart_type === 'kpi') return;
        const labels = this.state.data.labels || [];
        const data = this.state.data.data || [];
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Label,Value\n"; // Header
        
        for (let i = 0; i < labels.length; i++) {
            let label = labels[i].toString().replace(/"/g, '""'); // Escape quotes
            csvContent += `"${label}",${data[i]}\n`;
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${this.props.item.name}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
ChartWidget.template = "dynamic_dashboards.ChartWidget";
