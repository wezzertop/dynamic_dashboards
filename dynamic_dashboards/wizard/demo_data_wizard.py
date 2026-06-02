from odoo import models, fields, api, _
from odoo.exceptions import UserError
import random
from datetime import timedelta

class DynamicDashboardDemoWizard(models.TransientModel):
    _name = 'dynamic.dashboard.demo.wizard'
    _description = 'Demo Data Generator Wizard'

    record_count = fields.Integer('Number of Sales Orders', default=50)
    
    def action_generate_demo_data(self):
        if 'sale.order' not in self.env or 'account.move' not in self.env:
            raise UserError(_("Please install the Sales and Invoicing apps first!"))
            
        Partner = self.env['res.partner']
        Product = self.env['product.product']
        SaleOrder = self.env['sale.order']
        
        # 1. Create Demo Partners
        partners = []
        for i in range(10):
            p = Partner.create({
                'name': f'Demo Customer {i+1}',
                'is_company': random.choice([True, False]),
                'city': random.choice(['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Miami'])
            })
            partners.append(p)
            
        # 2. Create Demo Products
        products = []
        for i in range(10):
            p = Product.create({
                'name': f'Demo Product {i+1}',
                'type': 'consu',
                'invoice_policy': 'order',
                'list_price': random.randint(10, 500) * 1.0,
                'standard_price': random.randint(5, 200) * 1.0,
            })
            products.append(p)
            
        # 3. Create Sales Orders spread over the last 6 months
        today = fields.Datetime.now()
        for i in range(self.record_count):
            days_ago = random.randint(0, 180)
            date_order = today - timedelta(days=days_ago)
            
            partner = random.choice(partners)
            
            order = SaleOrder.create({
                'partner_id': partner.id,
                'date_order': date_order,
                'state': 'draft',
            })
            
            for line_idx in range(random.randint(1, 5)):
                product = random.choice(products)
                qty = random.randint(1, 10)
                self.env['sale.order.line'].create({
                    'order_id': order.id,
                    'product_id': product.id,
                    'product_uom_qty': qty,
                    'price_unit': product.list_price,
                })
                
            if random.random() > 0.3:
                order.action_confirm()
                if random.random() > 0.5:
                    invoice = order._create_invoices()
                    if invoice:
                        invoice.write({'invoice_date': date_order.date()})
                        if random.random() > 0.5:
                            invoice.action_post()
                            
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Success'),
                'message': _('Successfully generated %s sales orders, along with products and customers.') % self.record_count,
                'type': 'success',
                'sticky': False,
            }
        }
