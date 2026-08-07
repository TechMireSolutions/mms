export function buildCountrySelectOptions(
  countryCodesDraft: Array<{ country: string; code: string }>,
  formatDialCode: (code: string) => string,
): Array<{ value: string; label: string }> {
  return (countryCodesDraft || []).map((countryCodeObj) => {
    const formattedCode = formatDialCode(countryCodeObj.code || "");
    return {
      value: countryCodeObj.country,
      label: formattedCode
        ? `${countryCodeObj.country} (${formattedCode})`
        : countryCodeObj.country,
    };
  });
}
