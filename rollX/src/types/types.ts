import mongoose from "mongoose";

// The shape of a member after serialization for the client
export type SerializableMember = {
  _id: string;
  name: string;
  email: string;
  profile?: {
    universityRollNo?: string;
    classRollNo?: string;
    fullName?: string;
  };
};

// The shape of the session data AFTER it has been populated and is ready for the client.
export type PopulatedSession = {
  _id: mongoose.Types.ObjectId;
  shortCode: string;
  expiresAt: Date;
  presentMembers: SerializableMember[];
  absentMembers: SerializableMember[];
};

// The props for your client component.
export type HostLiveViewProps = {
  session: {
    id: string;
    shortCode: string;
    expiresAt: string;
  };
  group: {
    id: string;
    name: string;
    totalMembers: number;
  };
  initialPresentMembers: SerializableMember[];
  initialAbsentMembers: SerializableMember[];
  rosterMembers: SerializableMember[];
};
