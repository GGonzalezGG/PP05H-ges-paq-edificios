export class Package {
    id?: string; // Optional: auto-generated by DB
    recipientName: string;
    apartmentNumber: string;
    receivedDate: Date;
    deliveredDate?: Date;
    receivedBy: string; // Name of the receptionist or staff
    deliveredBy?: string;
    status: 'pending' | 'delivered' | 'returned';
    notes?: string;
  
    constructor(data: {
      recipientName: string;
      apartmentNumber: string;
      receivedDate: Date;
      receivedBy: string;
      status?: 'pending' | 'delivered' | 'returned';
      deliveredDate?: Date;
      deliveredBy?: string;
      notes?: string;
    }) {
      this.recipientName = data.recipientName;
      this.apartmentNumber = data.apartmentNumber;
      this.receivedDate = data.receivedDate;
      this.receivedBy = data.receivedBy;
      this.status = data.status ?? 'pending';
      this.deliveredDate = data.deliveredDate;
      this.deliveredBy = data.deliveredBy;
      this.notes = data.notes;
    }
  }
  