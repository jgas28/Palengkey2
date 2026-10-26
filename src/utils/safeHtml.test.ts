import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "@/utils/safeHtml";

describe("sanitizeRichText", () => {
  it("keeps bold, italic and underline", () => {
    expect(
      sanitizeRichText(
        "Use <b><i>SUKI100</i></b> or <strong>FRESH50</strong> <u>today</u>",
      ),
    ).toBe("Use <b><i>SUKI100</i></b> or <strong>FRESH50</strong> <u>today</u>");
  });

  it("turns typed new lines into line breaks", () => {
    expect(sanitizeRichText("Line one\nLine two")).toBe("Line one<br>Line two");
  });

  it("drops attributes, even on allowed tags", () => {
    expect(sanitizeRichText('<b onclick="alert(1)" style="color:red">Hi</b>')).toBe(
      "<b>Hi</b>",
    );
  });

  it("removes scripts and unknown tags", () => {
    expect(
      sanitizeRichText(
        '<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:x">link</a>',
      ),
    ).toBe("link");
  });

  it("escapes text so it cannot become markup", () => {
    expect(sanitizeRichText("5 &lt; 6 &amp; <b>ok</b>")).toBe("5 &lt; 6 &amp; <b>ok</b>");
  });
});
