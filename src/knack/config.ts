// Values below come from the Knack MCP server at setup time. They are not secrets:
// APP_ID and CLIENT_ID are public identifiers, and the OAuth flow uses PKCE so no
// client secret exists. The private REST API key is never used in frontend code.

export const APP_ID = '6aa04444b6577f098d9dae6e'
export const API_BASE = 'https://api.knack.com'
export const CLIENT_ID = '6aa07e64358585b1738a3fa7'

/** Object keys from the Larkspur Patient Portal schema. */
export const OBJ = {
  accounts: 'object_1',
  patients: 'object_4',
  providers: 'object_5',
  appointments: 'object_6',
  documents: 'object_7',
  clinicAdmin: 'object_8',
} as const

/** Field keys, named so call sites read clearly. */
export const F = {
  appt: {
    date: 'field_60',
    visitType: 'field_61',
    status: 'field_62',
    notes: 'field_63',
    durationMins: 'field_64',
    patient: 'field_81',
    provider: 'field_82',
  },
  doc: {
    title: 'field_71',
    file: 'field_72',
    uploadedOn: 'field_73',
    docType: 'field_74',
    patient: 'field_83',
  },
  patient: {
    name: 'field_30',
    email: 'field_31',
    dob: 'field_41',
    phone: 'field_42',
    insurance: 'field_43',
    contactMethod: 'field_44',
    intakeNotes: 'field_45',
    active: 'field_58',
  },
  provider: {
    name: 'field_46',
    email: 'field_47',
    specialty: 'field_57',
    acceptingNew: 'field_59',
  },
} as const

/** profileKey -> the user role object holding that role's data. */
export const profileToObject: Record<string, string> = {
  profile_4: OBJ.patients,
  profile_5: OBJ.providers,
  profile_8: OBJ.clinicAdmin,
}

/** profileKey -> route. `all_users` gets a real landing page, never an error. */
export const roleRoutes: Record<string, string> = {
  all_users: '/welcome',
  profile_4: '/patient',
  profile_5: '/provider',
  profile_8: '/admin',
}

export const roleLabels: Record<string, string> = {
  all_users: 'Member',
  profile_4: 'Patient',
  profile_5: 'Provider',
  profile_8: 'Clinic Admin',
}
