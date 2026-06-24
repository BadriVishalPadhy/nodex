export function parse(
  text: string,
  values: any,
  startDelimeter = "{",
  endDelimeter = "}",
) {
  if (!text) return "";

  let startIndex = 0;
  let endIndex = 1;

  let finalString = "";
  while (endIndex < text.length) {
    if (text[startIndex] === startDelimeter) {
      let endPoint = startIndex + 2;
      // Bound the scan: an unterminated delimiter (e.g. "{name" with no "}")
      // would otherwise loop forever past the end of the string and hang the
      // worker. Emit the remaining text literally and stop.
      while (endPoint < text.length && text[endPoint] !== endDelimeter) {
        endPoint++;
      }
      if (endPoint >= text.length) {
        finalString += text.slice(startIndex);
        return finalString;
      }
      let stringHoldingValue = text.slice(startIndex + 1, endPoint);
      const keys = stringHoldingValue.split(".");
      let localValues: any = {
        ...values,
      };
      for (let i = 0; i < keys.length; i++) {
        if (localValues == null) break;
        if (typeof localValues === "string") {
          try {
            localValues = JSON.parse(localValues);
          } catch {
            localValues = undefined;
            break;
          }
        }
        localValues = localValues[keys[i]!];
      }
      finalString += localValues;
      startIndex = endPoint + 1;
      endIndex = endPoint + 2;
    } else {
      finalString += text[startIndex];
      startIndex++;
      endIndex++;
    }
  }
  if (text[startIndex]) {
    finalString += text[startIndex];
  }
  return finalString;
}
