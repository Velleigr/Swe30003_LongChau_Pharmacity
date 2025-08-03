import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface EmailNotificationRequest {
  pharmacist_id: string;
  patient_name: string;
  patient_phone: string;
  prescription_content: string;
  prescription_id: string;
  branch_name?: string;
}

// Email service using a mock implementation
// In production, you would integrate with services like SendGrid, Resend, or AWS SES
async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  try {
    // Mock email sending - in production, replace with actual email service
    console.log('=== EMAIL NOTIFICATION ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', htmlContent);
    console.log('========================');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, always return success
    // In production, implement actual email sending logic here
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

function generateEmailTemplate(data: EmailNotificationRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Prescription Notification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
            .footer { background: #1e293b; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
            .prescription-content { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border: 1px solid #d1d5db; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .urgent { color: #dc2626; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 Long Châu Pharmacy</h1>
                <h2>New Prescription Notification</h2>
            </div>
            
            <div class="content">
                <p class="urgent">⚡ URGENT: New prescription requires your review</p>
                
                <div class="info-box">
                    <h3>📋 Prescription Details</h3>
                    <p><strong>Prescription ID:</strong> #${data.prescription_id.slice(0, 8)}</p>
                    <p><strong>Submission Time:</strong> ${new Date().toLocaleString('en-US', { 
                      timeZone: 'Asia/Ho_Chi_Minh',
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                    ${data.branch_name ? `<p><strong>Branch:</strong> ${data.branch_name}</p>` : ''}
                </div>
                
                <div class="info-box">
                    <h3>👤 Patient Information</h3>
                    <p><strong>Name:</strong> ${data.patient_name}</p>
                    <p><strong>Phone:</strong> ${data.patient_phone}</p>
                </div>
                
                <div class="prescription-content">
                    <h3>💊 Prescription Content</h3>
                    <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${data.prescription_content}</pre>
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${supabaseUrl.replace('/rest/v1', '')}/pharmacist" class="button">
                        Review Prescription Now
                    </a>
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <h4 style="margin: 0 0 10px 0; color: #92400e;">⏰ Action Required</h4>
                    <p style="margin: 0; color: #92400e;">Please review this prescription within 30 minutes to ensure timely patient care.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Long Châu Pharmacy Management System</p>
                <p>📞 Hotline: 1800 6821 | 📧 support@longchau.com</p>
                <p style="font-size: 12px; margin-top: 10px;">
                    This is an automated notification. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

const NotificationController = {
  async sendPrescriptionNotification(data: EmailNotificationRequest) {
    try {
      // Get pharmacist email from database
      const { data: pharmacist, error: pharmacistError } = await supabase
        .from('users')
        .select('email, full_name, branch')
        .eq('id', data.pharmacist_id)
        .eq('role', 'pharmacist')
        .single()
      
      if (pharmacistError || !pharmacist) {
        return {
          status: 404,
          body: { error: 'Pharmacist not found' }
        }
      }
      
      // Get branch name if available
      const branchNames: { [key: string]: string } = {
        'hcm-district1': 'Long Châu Quận 1 - TP.HCM',
        'hcm-district3': 'Long Châu Quận 3 - TP.HCM',
        'hcm-district5': 'Long Châu Quận 5 - TP.HCM',
        'hcm-district7': 'Long Châu Quận 7 - TP.HCM',
        'hcm-tanbinh': 'Long Châu Tân Bình - TP.HCM',
        'hcm-binhthanh': 'Long Châu Bình Thạnh - TP.HCM'
      };
      
      const branchName = pharmacist.branch ? branchNames[pharmacist.branch] : undefined;
      
      // Prepare email content
      const emailData = {
        ...data,
        branch_name: branchName
      };
      
      const subject = `🚨 New Prescription Alert - Patient: ${data.patient_name}`;
      const htmlContent = generateEmailTemplate(emailData);
      
      // Send email notification
      const emailSent = await sendEmail(pharmacist.email, subject, htmlContent);
      
      if (!emailSent) {
        return {
          status: 500,
          body: { error: 'Failed to send email notification' }
        }
      }
      
      // Log notification in database (optional - for audit trail)
      try {
        await supabase
          .from('prescription_notifications')
          .insert([{
            prescription_id: data.prescription_id,
            pharmacist_id: data.pharmacist_id,
            patient_name: data.patient_name,
            notification_type: 'email',
            sent_at: new Date().toISOString(),
            status: 'sent'
          }]);
      } catch (logError) {
        // Don't fail the main operation if logging fails
        console.error('Failed to log notification:', logError);
      }
      
      return {
        status: 200,
        body: { 
          message: 'Prescription notification sent successfully',
          pharmacist_email: pharmacist.email,
          pharmacist_name: pharmacist.full_name
        }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method

    // Route: POST /send-prescription-notification
    if (method === 'POST' && pathParts.length === 1) {
      const notificationData = await req.json()
      const result = await NotificationController.sendPrescriptionNotification(notificationData)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route not found
    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})