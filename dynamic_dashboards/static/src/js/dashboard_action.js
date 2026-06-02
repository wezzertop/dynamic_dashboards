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
}
DynamicDashboardMain.components = { ChartWidget };
DynamicDashboardMain.template = "dynamic_dashboards.Main";

registry.category("actions").add("dynamic_dashboard_action", DynamicDashboardMain);
