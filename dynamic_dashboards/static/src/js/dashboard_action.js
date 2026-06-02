/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useState, onWillStart, onWillDestroy } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { ChartWidget } from "./chart_widget";

export class DynamicDashboardMain extends Component {
    setup() {
        this.orm = useService("orm");
        
        this.state = useState({
            loading: true,
            dashboards: [],
            activeDashboardId: null,
            dateFilter: 'all',
            darkMode: false,
            items: []
        });

        this.refreshInterval = null;

        onWillStart(async () => {
            await this.loadDashboards();
        });

        onWillDestroy(() => {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
        });
    }

    async loadDashboards() {
        this.state.loading = true;
        try {
            const dashboards = await this.orm.searchRead(
                "dynamic.dashboard",
                [['active', '=', true]],
                ['id', 'name', 'auto_refresh']
            );
            
            this.state.dashboards = dashboards;
            if (dashboards.length > 0) {
                await this.loadDashboardItems(dashboards[0].id);
            } else {
                this.state.loading = false;
            }
        } catch (e) {
            console.error("Failed to load dashboards", e);
            this.state.loading = false;
        }
    }

    setupAutoRefresh(dashboard) {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        if (dashboard && dashboard.auto_refresh && dashboard.auto_refresh !== '0') {
            const ms = parseInt(dashboard.auto_refresh) * 1000;
            this.refreshInterval = setInterval(() => {
                this.loadDashboardItems(dashboard.id, true);
            }, ms);
        }
    }

    async loadDashboardItems(dashboardId, isSilentRefresh = false) {
        if (!isSilentRefresh) {
            this.state.loading = true;
        }
        this.state.activeDashboardId = parseInt(dashboardId);
        
        try {
            const items = await this.orm.searchRead(
                "dynamic.dashboard.item",
                [['dashboard_id', '=', this.state.activeDashboardId]],
                ['id', 'name', 'chart_type', 'col_span', 'sequence'],
                { order: 'sequence, id' }
            );
            this.state.items = items;
            
            const dashboard = this.state.dashboards.find(d => d.id === this.state.activeDashboardId);
            if (!isSilentRefresh && dashboard) {
                this.setupAutoRefresh(dashboard);
            }
        } catch (e) {
            console.error("Failed to load items", e);
        } finally {
            this.state.loading = false;
        }
    }

    async onChangeDashboard(ev) {
        const dashId = ev.target.value;
        await this.loadDashboardItems(dashId);
    }

    async onChangeDateFilter(ev) {
        this.state.dateFilter = ev.target.value;
    }

    toggleDarkMode() {
        this.state.darkMode = !this.state.darkMode;
    }

    onDragStart(ev, item) {
        this.draggedItem = item;
        if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.setData('text/plain', item.id);
        }
        setTimeout(() => {
            if (ev.target && ev.target.style) {
                ev.target.style.opacity = '0.5';
            }
        }, 0);
    }

    onDragOver(ev) {
        if (ev.dataTransfer) {
            ev.dataTransfer.dropEffect = 'move';
        }
    }

    async onDrop(ev, targetItem) {
        if (!this.draggedItem || this.draggedItem.id === targetItem.id) {
            return;
        }

        const items = [...this.state.items];
        const draggedIdx = items.findIndex(i => i.id === this.draggedItem.id);
        const targetIdx = items.findIndex(i => i.id === targetItem.id);

        items.splice(draggedIdx, 1);
        items.splice(targetIdx, 0, this.draggedItem);

        items.forEach((item, idx) => {
            item.sequence = idx * 10;
        });

        this.state.items = items;

        try {
            const updates = items.map(item => ({
                id: item.id,
                sequence: item.sequence
            }));
            
            await Promise.all(updates.map(u => 
                this.orm.write("dynamic.dashboard.item", [u.id], { sequence: u.sequence })
            ));
        } catch (e) {
            console.error("Failed to save new order", e);
        }
    }

    onDragEnd(ev) {
        if (ev.target && ev.target.style) {
            ev.target.style.opacity = '1';
        }
        this.draggedItem = null;
    }
}
DynamicDashboardMain.components = { ChartWidget };
DynamicDashboardMain.template = "dynamic_dashboards.Main";

registry.category("actions").add("dynamic_dashboard_action", DynamicDashboardMain);
