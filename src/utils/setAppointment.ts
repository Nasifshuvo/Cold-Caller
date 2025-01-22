import fs from 'fs/promises';
import path from 'path';

export interface Appointment {
  name?: string;
  email: string;
  datetime: string;
  createdAt: string;
}

export async function setAppointment(appointmentData: Omit<Appointment, 'createdAt'>) {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'appointments.json');
    let appointments: Appointment[] = [];
    
    // Read existing appointments
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      appointments = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading appointments file:', error);
      // File doesn't exist or is empty, start with empty array
      appointments = [];
    }

    // Create new appointment with createdAt
    const newAppointment: Appointment = {
      ...appointmentData,
      createdAt: new Date().toISOString()
    };

    // Add new appointment and write back to file
    appointments.push(newAppointment);
    await fs.writeFile(filePath, JSON.stringify(appointments, null, 2));

    return newAppointment;
  } catch (error) {
    console.error('Error setting appointment:', error);
    throw error;
  }
}
