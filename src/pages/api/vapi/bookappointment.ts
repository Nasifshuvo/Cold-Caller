import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { setAppointment } from '@/utils/setAppointment';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Parse form data
    const form = formidable();
    const [fields] = await new Promise<[formidable.Fields]>((resolve, reject) => {
      form.parse(req, (err, fields) => {
        if (err) reject(err);
        resolve([fields]);
      });
    });

    console.log('Received form data:', fields);

    // Validate required fields
    if (!fields.email || !fields.datetime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        data: {
          required: ['email', 'datetime'],
          received: fields
        }
      });
    }

    // Create and save appointment
    const appointmentData = {
      email: fields.email[0],
      datetime: fields.datetime[0],
      name: fields.name?.[0]
    };

    const newAppointment = await setAppointment(appointmentData);

    return res.status(200).json({
      success: true,
      message: 'Appointment booked successfully',
      data: newAppointment
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Webhook processing failed'
    });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
