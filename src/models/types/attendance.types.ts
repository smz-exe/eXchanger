export interface AttendanceAttributes {
    id: number;
    userId: number;
    timestamp: Date;
    consecutiveDays: number;
    beforeSevenCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AttendanceCreationAttributes
    extends Partial<
        Pick<
            AttendanceAttributes,
            "id" | "timestamp" | "consecutiveDays" | "beforeSevenCount"
        >
    > {
    userId: number;
}
