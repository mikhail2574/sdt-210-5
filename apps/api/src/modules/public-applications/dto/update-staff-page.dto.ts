export class UpdateStaffPageDto {
  edits!: Array<{
    fieldPath: string;
    newValue: unknown;
    reason?: string;
  }>;
}
