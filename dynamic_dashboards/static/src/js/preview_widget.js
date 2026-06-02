/** @odoo-module **/

import { Component, useState, useEffect } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { ChartWidget } from "./chart_widget";

export class DashboardItemPreview extends Component {
    setup() {
        this.orm = useService("orm");
        
        this.state = useState({
            data: {},
            loading: false
        });

        useEffect(() => {
            this.fetchPreviewData();
        }, () => [
            this.props.record.data.model_name,
            this.props.record.data.domain,
            this.props.record.data.group_by_field_name,
            this.props.record.data.measure_field_name,
            this.props.record.data.chart_type,
            this.props.record.data.date_field_name
        ]);
    }

    async fetchPreviewData() {
        const data = this.props.record.data;
        if (!data.model_name || !data.group_by_field_name) {
            this.state.data = {};
            return;
        }

        this.state.loading = true;
        try {
            const result = await this.orm.call(
                "dynamic.dashboard.item",
                "fetch_preview_data",
                [
                    data.model_name,
                    data.domain || '[]',
                    data.group_by_field_name,
                    data.measure_field_name || 'id',
                    data.chart_type || 'bar',
                    data.date_field_name || ''
                ]
            );
            this.state.data = result;
        } catch (e) {
            console.error("Failed to load preview", e);
        } finally {
            this.state.loading = false;
        }
    }
}

DashboardItemPreview.template = "dynamic_dashboards.PreviewWidget";
DashboardItemPreview.components = { ChartWidget };
DashboardItemPreview.props = { ...standardFieldProps };

registry.category("fields").add("dashboard_item_preview", DashboardItemPreview);
