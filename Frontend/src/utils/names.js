/** Faculty display name in the active language (falls back to English when no Arabic name is stored). */
export const facultyName = (faculty, lang) => {
  if (!faculty) return '';
  return lang === 'ar' && faculty.nameAr ? faculty.nameAr : faculty.nameEn;
};

/** The reference "faculty" fields differ slightly between endpoints; this normalises them. */
export const facultyFromFlat = (nameEn, nameAr) => ({ nameEn, nameAr });
