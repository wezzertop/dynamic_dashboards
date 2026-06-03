/** @odoo-module **/

import { Component, useState, onWillStart, onMounted, useRef, onPatched } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export class ChartWidget extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.notification = useService("notification");
        this.canvasRef = useRef("canvas");
        this.chartInstance = null;
        
        this.state = useState({
            loading: true,
            data: {},
            updateTrigger: 0
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

    get colorTheme() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_color_theme_${itemId}`) || 'default') : 'default';
    }

    get customBaseColor() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_custom_color_${itemId}`) || '#36a2eb') : '#36a2eb';
    }

    get showDataLabels() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_show_labels_${itemId}`) === 'true') : false;
    }

    get showLegend() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_show_legend_${itemId}`) !== 'false') : true;
    }

    get showGridlines() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_show_grid_${itemId}`) !== 'false') : true;
    }

    get smoothLines() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_smooth_${itemId}`) !== 'false') : true;
    }

    get roundedBars() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_rounded_${itemId}`) !== 'false') : true;
    }

    get enableAnimations() {
        const itemId = this.props.item.id;
        return itemId ? (localStorage.getItem(`dashboard_item_animate_${itemId}`) !== 'false') : true;
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
                this.env.bus.trigger('refresh_dashboard');
            }
        });
    }

    async changeChartType(type) {
        if (!this.props.item || !this.props.item.id) return;
        this.props.item.chart_type = type;
        await this.orm.write("dynamic.dashboard.item", [this.props.item.id], { chart_type: type });
        this.renderChart();
    }

    async changeChartSize(size) {
        if (!this.props.item || !this.props.item.id) return;
        this.props.item.col_span = size.toString();
        await this.orm.write("dynamic.dashboard.item", [this.props.item.id], { col_span: size.toString() });
        this.env.bus.trigger('refresh_dashboard');
    }

    async copyToDashboard(targetDashboardId) {
        if (!this.props.item || !this.props.item.id) return;
        try {
            await this.orm.call("dynamic.dashboard.item", "copy", [this.props.item.id], {
                default: { dashboard_id: targetDashboardId }
            });
            if (this.notification) {
                this.notification.add(_t("Chart copied successfully!"), {
                    type: "success",
                    sticky: false
                });
            }
        } catch (e) {
            console.error("Failed to copy chart", e);
        }
    }

    selectColorTheme(theme) {
        if (!this.props.item || !this.props.item.id) return;
        localStorage.setItem(`dashboard_item_color_theme_${this.props.item.id}`, theme);
        this.state.updateTrigger++;
        this.renderChart();
    }

    onCustomColorChange(ev) {
        if (!this.props.item || !this.props.item.id) return;
        const color = ev.target.value;
        localStorage.setItem(`dashboard_item_color_theme_${this.props.item.id}`, 'custom');
        localStorage.setItem(`dashboard_item_custom_color_${this.props.item.id}`, color);
        this.state.updateTrigger++;
        this.renderChart();
    }

    toggleDataLabels() {
        if (!this.props.item || !this.props.item.id) return;
        localStorage.setItem(`dashboard_item_show_labels_${this.props.item.id}`, !this.showDataLabels);
        this.state.updateTrigger++;
        this.renderChart();
    }

    toggleLegend() {
        if (!this.props.item || !this.props.item.id) return;
        localStorage.setItem(`dashboard_item_show_legend_${this.props.item.id}`, !this.showLegend);
        this.state.updateTrigger++;
        this.renderChart();
    }

    toggleGridlines() {
        if (!this.props.item || !this.props.item.id) return;
        localStorage.setItem(`dashboard_item_show_grid_${this.props.item.id}`, !this.showGridlines);
        this.state.updateTrigger++;
        this.renderChart();
    }

    async changeRecordLimit(limit) {
        if (!this.props.item || !this.props.item.id) return;
        this.props.item.limit = limit;
        await this.orm.write("dynamic.dashboard.item", [this.props.item.id], { limit: limit });
        await this.fetchData();
        this.renderChart();
    }

    toggleSmoothLines() {
        if (!this.props.item || !this.props.item.id) return;
        localStorage.setItem(`dashboard_item_smooth_${this.props.item.id}`, !this.smoothLines);
        this.state.updateTrigger++;
        this.renderChart();
    }

    toggleRoundedBars() {
        if (!this.props.item || !this.props.item.id) return;
        localStorage.setItem(`dashboard_item_rounded_${this.props.item.id}`, !this.roundedBars);
        this.state.updateTrigger++;
        this.renderChart();
    }

    toggleAnimations() {
        if (!this.props.item || !this.props.item.id) return;
        localStorage.setItem(`dashboard_item_animate_${this.props.item.id}`, !this.enableAnimations);
        this.state.updateTrigger++;
        this.renderChart();
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    hexToHsl(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    generateShades(baseHex, count) {
        if (count <= 1) return [baseHex];
        const hsl = this.hexToHsl(baseHex);
        let colors = [];
        for (let i = 0; i < count; i++) {
            let h = (hsl.h + (i * 12)) % 360;
            let s = Math.min(95, Math.max(50, hsl.s - 15 + ((i % 2) * 20)));
            let step = i / (count - 1);
            let l = Math.round(30 + (step * 45));
            colors.push(`hsl(${h}, ${s}%, ${l}%)`);
        }
        return colors;
    }

    getThemeColors(theme, count) {
        let palette = [];
        switch (theme) {
            case 'cool':
                palette = ['#0288D1', '#03A9F4', '#29B6F6', '#4FC3F7', '#81D4FA', '#B3E5FC']; break;
            case 'warm':
                palette = ['#D32F2F', '#E53935', '#F44336', '#EF5350', '#E57373', '#EF9A9A']; break;
            case 'emerald':
                palette = ['#388E3C', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9']; break;
            case 'purple':
                palette = ['#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8']; break;
            case 'custom':
                return this.generateShades(this.customBaseColor, count);
            case 'random':
                for (let i = 0; i < count; i++) palette.push(this.getRandomColor());
                return palette;
            default:
                palette = ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']; break;
        }
        
        let result = [];
        for (let i = 0; i < count; i++) {
            result.push(palette[i % palette.length]);
        }
        return result;
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
        const baseColors = this.getThemeColors(this.colorTheme, data.length);
        
        // Add opacity for background
        const backgroundColors = baseColors.map(c => {
            if(c.length === 7) return c + 'B3'; // hex to 70% opacity
            if(c.startsWith('rgba')) return c.replace('1)', '0.7)');
            return c;
        });
        
        const borderColors = baseColors;

        let chartJsType = type;
        let fillArea = false;
        if (chartJsType === 'area') {
            chartJsType = 'line';
            fillArea = true;
        }

        const customDataLabels = {
            id: 'customDataLabels',
            afterDatasetsDraw: (chart, args, pluginOptions) => {
                if (!this.showDataLabels) return;
                const { ctx } = chart;
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    meta.data.forEach((element, index) => {
                        ctx.fillStyle = this.props.darkMode ? '#fff' : '#000';
                        const dataString = this.formatNumber(dataset.data[index]);
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const position = element.tooltipPosition();
                        ctx.fillText(dataString, position.x, position.y - 15);
                    });
                });
            }
        };

        const lineFillColor = borderColors[0].startsWith('#') 
            ? borderColors[0] + '33' 
            : borderColors[0].replace('1)', '0.2)').replace('B3', '33');

        const config = {
            type: chartJsType,
            plugins: [customDataLabels],
            data: {
                labels: labels,
                datasets: [{
                    label: this.props.item.name,
                    data: data,
                    backgroundColor: chartJsType === 'line' ? lineFillColor : backgroundColors,
                    borderColor: chartJsType === 'line' ? borderColors[0] : borderColors,
                    borderWidth: 2,
                    fill: fillArea,
                    tension: chartJsType === 'line' ? (this.smoothLines ? 0.4 : 0) : 0,
                    borderRadius: chartJsType === 'bar' ? (this.roundedBars ? 8 : 0) : 0
                }]
            },
            options: {
                animation: this.enableAnimations ? { duration: 800 } : { duration: 0 },
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
                        display: this.showLegend && ['pie', 'doughnut', 'bar', 'line'].includes(chartJsType),
                        position: 'bottom',
                        labels: {
                            color: this.props.darkMode ? '#fff' : '#666'
                        }
                    }
                },
                scales: ['pie', 'doughnut', 'radar', 'polarArea'].includes(chartJsType) ? {} : {
                    x: {
                        ticks: { color: this.props.darkMode ? '#aaa' : '#666' },
                        grid: { 
                            display: this.showGridlines,
                            color: this.props.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                        }
                    },
                    y: {
                        grace: '15%',
                        ticks: { color: this.props.darkMode ? '#aaa' : '#666' },
                        grid: { 
                            display: this.showGridlines,
                            color: this.props.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                        }
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
