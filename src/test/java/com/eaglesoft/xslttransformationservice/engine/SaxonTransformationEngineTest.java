/**
 * Exercises the transformation engine directly for successful and failing Saxon scenarios.
 * These unit tests keep engine behavior covered without going through the web layer.
 */
package com.eaglesoft.xslttransformationservice.engine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.fail;

import com.eaglesoft.xslttransformationservice.config.XsltTransformationProperties;
import com.eaglesoft.xslttransformationservice.exception.OutputSizeExceededException;
import com.eaglesoft.xslttransformationservice.exception.XsltCompilationException;
import com.eaglesoft.xslttransformationservice.exception.XsltRuntimeException;
import org.junit.jupiter.api.Test;
import org.springframework.util.unit.DataSize;

class SaxonTransformationEngineTest {

  private final SaxonTransformationEngine transformationEngine = new SaxonTransformationEngine(defaultProperties());

  // Verifies that a shallow-copy stylesheet preserves the original XML structure.
  @Test
  void transformReturnsIdentityResult() {
    String xml = "<root><item>Hello</item></root>";
    String xslt = """
        <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:mode on-no-match="shallow-copy"/>
        </xsl:stylesheet>
        """;

    String result = transformationEngine.transform(xml, xslt);

    assertThat(result).isEqualTo("<?xml version=\"1.0\" encoding=\"UTF-8\"?><root><item>Hello</item></root>");
  }

  // Verifies that the engine returns the expected XML for a simple stylesheet.
  @Test
  void transformReturnsExpectedXml() {
    String xml = "<root><item>Hello</item></root>";
    String xslt = """
        <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:template match="/">
            <result>
              <xsl:value-of select="/root/item"/>
            </result>
          </xsl:template>
        </xsl:stylesheet>
        """;

    String result = transformationEngine.transform(xml, xslt);

    assertThat(result).isEqualTo("<?xml version=\"1.0\" encoding=\"UTF-8\"?><result>Hello</result>");
  }

  // Verifies that invalid XSLT raises the expected compilation exception.
  @Test
  void transformRejectsInvalidXslt() {
    String xml = "<root><item>Hello</item></root>";
    String xslt = """
        <xsl:stylesheet version="3.0">
          <xsl:template match="/">
            <result>Hello</result>
          </xsl:template>
        </xsl:stylesheet>
        """;

    assertThatThrownBy(() -> transformationEngine.transform(xml, xslt))
        .isInstanceOf(XsltCompilationException.class)
        .hasMessage("XSLT compilation failed");
  }

  // Verifies that external stylesheet resources are blocked by the engine.
  @Test
  void transformRejectsExternalResources() {
    String xml = "<root><item>Hello</item></root>";
    String xslt = """
        <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:include href="https://example.com/external.xsl"/>
        </xsl:stylesheet>
        """;

    try {
      transformationEngine.transform(xml, xslt);
      fail("Expected XSLT compilation to fail when external resource access is attempted");
    } catch (XsltCompilationException exception) {
      assertThat(exception.getDetails()).contains("External resource access is disabled");
    }
  }

  // Verifies that terminating stylesheet execution surfaces as a runtime exception.
  @Test
  void transformReportsRuntimeFailure() {
    String xml = "<root><item>Hello</item></root>";
    String xslt = """
        <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:template match="/">
            <xsl:message terminate="yes">Forced runtime failure</xsl:message>
          </xsl:template>
        </xsl:stylesheet>
        """;

    assertThatThrownBy(() -> transformationEngine.transform(xml, xslt))
        .isInstanceOf(XsltRuntimeException.class)
        .hasMessage("XSLT execution failed");
  }

  // Verifies that the engine aborts when the serialized output exceeds the limit.
  @Test
  void transformRejectsOversizedOutput() {
    XsltTransformationProperties properties = defaultProperties();
    properties.setMaxOutputSize(DataSize.ofBytes(10));
    SaxonTransformationEngine limitedEngine = new SaxonTransformationEngine(properties);
    String xml = "<root><item>Hello</item></root>";
    String xslt = """
        <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:template match="/">
            <result>
              <xsl:value-of select="/root/item"/>
            </result>
          </xsl:template>
        </xsl:stylesheet>
        """;

    assertThatThrownBy(() -> limitedEngine.transform(xml, xslt))
        .isInstanceOf(OutputSizeExceededException.class)
        .hasMessage("Transformation output exceeds the maximum allowed size");
  }

  // Creates the default property set used by the engine tests.
  private static XsltTransformationProperties defaultProperties() {
    return new XsltTransformationProperties();
  }
}

