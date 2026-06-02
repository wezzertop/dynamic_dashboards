from odoo import models, fields, api, _
from odoo.exceptions import UserError
import ast

class DynamicDashboardItem(models.Model):
    _name = 'dynamic.dashboard.item'
    _description = 'Dynamic Dashboard Item'
    _order = 'sequence, id'

    name = fields.Char(string='Item Name', required=True, translate=True)
    dashboard_id = fields.Many2one('dynamic.dashboard', string='Dashboard', required=True, ondelete='cascade')
    sequence = fields.Integer(default=10)
    
    # UI configuration
    col_span = fields.Selection([
        ('3', '1/4 Width'),
        ('4', '1/3 Width'),
        ('6', '1/2 Width'),
        ('8', '2/3 Width'),
        ('12', 'Full Width')
    ], string='Column Span', default='6', required=True)
    
    chart_type = fields.Selection([
        ('kpi', 'KPI Card (Single Value)'),
        ('bar', 'Bar Chart'),
        ('line', 'Line Chart'),
        ('pie', 'Pie Chart'),
        ('doughnut', 'Doughnut Chart'),
        ('radar', 'Radar Chart'),
        ('polarArea', 'Polar Area Chart'),
        ('area', 'Area Chart'),
        ('list', 'List View (Data Table)')
    ], string='Chart Type', required=True, default='bar')

    # Data configuration
    model_id = fields.Many2one('ir.model', string='Odoo Model', domain=[('transient', '=', False)], ondelete='set null')
    model_name = fields.Char(related='model_id.model', string='Model Name', store=True)
    
    domain = fields.Char(string='Filter Domain', default="[]", help="e.g. [('state', '=', 'sale')]")
    
    preview = fields.Boolean(string='Live Preview', default=True)
    
    # For charts
    measure_field_id = fields.Many2one('ir.model.fields', string='Measure Field', 
                                       domain="[('model_id', '=', model_id), ('ttype', 'in', ['integer', 'float', 'monetary'])]", ondelete='set null')
    measure_field_name = fields.Char(related='measure_field_id.name', string='Measure Name', store=True)
    
    date_field_id = fields.Many2one('ir.model.fields', string='Date Field (For Line/Time charts)', 
                                    domain="[('model_id', '=', model_id), ('ttype', 'in', ['date', 'datetime'])]", ondelete='set null')
    date_field_name = fields.Char(related='date_field_id.name', string='Date Name', store=True)
    
    group_by_field_id = fields.Many2one('ir.model.fields', string='Group By Field', 
                                        domain="[('model_id', '=', model_id), ('ttype', 'in', ['many2one', 'selection', 'char'])]", ondelete='set null')
    group_by_field_name = fields.Char(related='group_by_field_id.name', string='Group By Name', store=True)
    
    limit = fields.Integer(string='Record Limit', default=10, help="Max records for Pie/Bar charts")

    @api.model
    def fetch_dashboard_data(self, item_id, date_filter='all'):
        item = self.browse(item_id)
        if not item.exists():
            return {}

        domain = ast.literal_eval(item.domain or '[]')
        
        # Apply Global Date Filter
        if date_filter != 'all' and item.date_field_name:
            today = fields.Date.context_today(self)
            if date_filter == 'today':
                domain.append((item.date_field_name, '>=', today))
            elif date_filter == 'this_month':
                domain.append((item.date_field_name, '>=', today.replace(day=1)))
            elif date_filter == 'this_year':
                domain.append((item.date_field_name, '>=', today.replace(month=1, day=1)))

        model = self.env[item.model_name]
        
        result = {
            'labels': [],
            'data': [],
            'kpi_value': 0,
            'title': item.name,
            'type': item.chart_type,
            'col_span': item.col_span
        }

        # Handle KPI Card (Just sum/count)
        if item.chart_type == 'kpi':
            if item.measure_field_name:
                records = model.search_read(domain, [item.measure_field_name])
                result['kpi_value'] = sum(r.get(item.measure_field_name, 0) for r in records)
            else:
                result['kpi_value'] = model.search_count(domain)
            return result

        # Handle Charts (Group By)
        if not item.group_by_field_name and not item.date_field_name:
            # Need something to group by
            return result

        groupby = item.group_by_field_name
        if not groupby and item.date_field_name:
            groupby = f"{item.date_field_name}:month"
            
        measure = item.measure_field_name or 'id'
        
        # We use read_group for efficient SQL grouping
        groups = model.read_group(domain, [measure], [groupby], limit=item.limit)
        
        for g in groups:
            # Format label
            label = g.get(groupby)
            if isinstance(label, tuple):
                label = label[1]  # many2one name
            elif not label:
                label = _("Undefined")
                
            result['labels'].append(label)
            
            # Format value
            if measure == 'id':
                val = g.get(f"{groupby}_count", 0)
            else:
                val = g.get(measure, 0)
            result['data'].append(val)
            
        return result

    @api.model
    def get_action_for_drilldown(self, item_id, label, date_filter='all'):
        item = self.browse(item_id)
        if not item.exists() or not item.model_name:
            return False

        domain = ast.literal_eval(item.domain or '[]')
        
        # Apply Global Date Filter
        if date_filter != 'all' and item.date_field_name:
            today = fields.Date.context_today(self)
            if date_filter == 'today':
                domain.append((item.date_field_name, '>=', today))
            elif date_filter == 'this_month':
                domain.append((item.date_field_name, '>=', today.replace(day=1)))
            elif date_filter == 'this_year':
                domain.append((item.date_field_name, '>=', today.replace(month=1, day=1)))

        # Add the clicked label to domain
        if item.group_by_field_name:
            if label == _("Undefined"):
                domain.append((item.group_by_field_name, '=', False))
            else:
                # Handle relational fields by matching name, or direct match
                field = self.env['ir.model.fields'].search([('model_id.model', '=', item.model_name), ('name', '=', item.group_by_field_name)])
                if field.ttype in ['many2one']:
                    domain.append((item.group_by_field_name + '.display_name', '=', label))
                else:
                    domain.append((item.group_by_field_name, '=', label))
        elif item.date_field_name and not item.group_by_field_name:
            # If grouped by date, it's tricky, we'd need to parse the label. For now, just return base domain
            pass

        return {
            'type': 'ir.actions.act_window',
            'name': f"{item.name} - {label}",
            'res_model': item.model_name,
            'view_mode': 'list,form',
            'domain': domain,
            'target': 'current',
        }

    @api.model
    def fetch_preview_data(self, model_name, domain_str, group_by, measure, chart_type, date_field):
        if not model_name or not group_by:
            return {'labels': [], 'data': []}
            
        try:
            domain = ast.literal_eval(domain_str or '[]')
            
            if measure == 'id':
                groups = self.env[model_name].read_group(domain, [group_by], [group_by])
            else:
                groups = self.env[model_name].read_group(domain, [measure], [group_by])
                
            result = {'labels': [], 'data': [], 'type': chart_type}
            
            # Sort by value descending and take top 10
            if measure == 'id':
                groups = sorted(groups, key=lambda x: x.get(f"{group_by}_count", 0), reverse=True)[:10]
            else:
                groups = sorted(groups, key=lambda x: x.get(measure, 0), reverse=True)[:10]
                
            for g in groups:
                label_val = g.get(group_by)
                if isinstance(label_val, tuple):
                    label = label_val[1]
                elif label_val:
                    label = str(label_val)
                else:
                    label = _("Undefined")
                result['labels'].append(label)
                
                if measure == 'id':
                    val = g.get(f"{group_by}_count", 0)
                else:
                    val = g.get(measure, 0)
                result['data'].append(val)
                
            return result
        except Exception as e:
            # If domain or fields are invalid, just return empty gracefully
            return {'labels': [], 'data': []}
