export interface MeetingRoom {
  id: string;
  name: string;
  slug: string;
  description?: string;
  capacity: number;
  minSeats?: number;
  maxSeats?: number;
  hourlyRate: number;
  perSeatPrice?: number;
  serviceChargeType?: 'fixed' | 'percentage' | 'none';
  serviceChargeValue?: number;
  startTime?: string;
  endTime?: string;
  category?: string;
  imageUrl?: string;
  featuredImage?: string;
  images?: string[] | string;
  amenities?: string[];
  isAvailable?: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime?: string;
  label?: string;
  hour?: string;
  isAvailable: boolean;
  isPast?: boolean;
}

export interface AvailabilityData {
  date: string;
  operatingHours?: string;
  timeSlots: TimeSlot[];
}

export type PaymentMethod = 'credits' | 'wallet' | 'razorpay' | 'reception';

export interface BookingFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  gstin?: string;
}

export interface BookingPayload extends BookingFormData {
  meetingRoomId: string;
  roomSlug: string;
  bookingDate: string;
  selectedSlots: string[];
  seatsBooked: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  userId?: string;
}
