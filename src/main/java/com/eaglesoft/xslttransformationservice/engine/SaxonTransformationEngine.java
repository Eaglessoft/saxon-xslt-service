/**
 * Compiles and executes XSLT transformations in memory using Saxon-HE.
 * It also applies security restrictions and output limits close to the transformation boundary.
 */
package com.eaglesoft.xslttransformationservice.engine;

import com.eaglesoft.xslttransformationservice.config.XsltTransformationProperties;
import com.eaglesoft.xslttransformationservice.exception.OutputSizeExceededException;
import com.eaglesoft.xslttransformationservice.exception.XsltCompilationException;
import com.eaglesoft.xslttransformationservice.exception.XsltRuntimeException;
import java.io.IOException;
import java.io.StringReader;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import javax.xml.transform.Source;
import javax.xml.transform.stream.StreamSource;
import net.sf.saxon.lib.Feature;
import net.sf.saxon.lib.ResourceRequest;
import net.sf.saxon.lib.ResourceResolver;
import net.sf.saxon.s9api.DocumentBuilder;
import net.sf.saxon.s9api.Processor;
import net.sf.saxon.s9api.SaxonApiException;
import net.sf.saxon.s9api.Serializer;
import net.sf.saxon.s9api.XdmNode;
import net.sf.saxon.s9api.Xslt30Transformer;
import net.sf.saxon.s9api.XsltCompiler;
import net.sf.saxon.s9api.XsltExecutable;
import net.sf.saxon.trans.XPathException;
import org.springframework.stereotype.Component;

@Component
public class SaxonTransformationEngine {

  private final Processor processor;
  private final long maxOutputSizeInBytes;
  private final ResourceResolver blockingResourceResolver = this::blockExternalResource;

  // Creates the Saxon processor and captures the configured output-size limit.
  public SaxonTransformationEngine(XsltTransformationProperties properties) {
    this.processor = new Processor(false);
    this.maxOutputSizeInBytes = properties.getMaxOutputSize().toBytes();
    configureSecurity();
  }

  // Compiles the stylesheet, runs the transformation, and returns the serialized result.
  public String transform(String xml, String xslt) {
    XsltExecutable executable = compile(xslt);

    try {
      XdmNode sourceDocument = buildSourceDocument(xml);
      Xslt30Transformer transformer = executable.load30();
      LimitedOutputWriter outputWriter = new LimitedOutputWriter(maxOutputSizeInBytes);
      Serializer serializer = processor.newSerializer(outputWriter);
      transformer.transform(sourceDocument.asSource(), serializer);
      return outputWriter.toString();
    } catch (SaxonApiException exception) {
      OutputLimitExceededIOException outputLimitFailure = findCause(exception, OutputLimitExceededIOException.class);
      if (outputLimitFailure != null) {
        throw new OutputSizeExceededException(
            "Transformation output exceeds the maximum allowed size",
            "output size is " + outputLimitFailure.getActualSize() + " bytes but limit is "
                + outputLimitFailure.getMaxSize() + " bytes",
            exception
        );
      }

      throw new XsltRuntimeException(
          "XSLT execution failed",
          exception.getMessage(),
          exception
      );
    }
  }

  // Applies processor-level settings that block external access and unsafe features.
  private void configureSecurity() {
    // Keep the processor locked down so request-provided stylesheets stay self-contained.
    processor.setConfigurationProperty(Feature.ALLOW_EXTERNAL_FUNCTIONS, false);
    processor.setConfigurationProperty(Feature.ALLOWED_PROTOCOLS, "");
    processor.setConfigurationProperty(Feature.DTD_VALIDATION, false);
    processor.setConfigurationProperty(Feature.XINCLUDE, false);
    processor.setConfigurationProperty(Feature.RESOURCE_RESOLVER, blockingResourceResolver);
  }

  // Compiles the supplied XSLT and converts Saxon failures into compilation exceptions.
  private XsltExecutable compile(String xslt) {
    try {
      XsltCompiler compiler = processor.newXsltCompiler();
      compiler.setResourceResolver(blockingResourceResolver);
      return compiler.compile(new StreamSource(new StringReader(xslt)));
    } catch (SaxonApiException exception) {
      throw new XsltCompilationException(
          "XSLT compilation failed",
          exception.getMessage(),
          exception
      );
    }
  }

  // Parses the input XML into the Saxon document model used during execution.
  private XdmNode buildSourceDocument(String xml) throws SaxonApiException {
    DocumentBuilder documentBuilder = processor.newDocumentBuilder();
    documentBuilder.setDTDValidation(false);
    return documentBuilder.build(new StreamSource(new StringReader(xml)));
  }

  // Rejects any attempt to resolve external resources from user-provided stylesheets.
  private Source blockExternalResource(ResourceRequest request) throws XPathException {
    throw new XPathException("External resource access is disabled");
  }

  // Walks the exception chain to locate a nested failure of the requested type.
  private <T extends Throwable> T findCause(Throwable throwable, Class<T> expectedType) {
    Throwable current = throwable;
    while (current != null) {
      if (expectedType.isInstance(current)) {
        return expectedType.cast(current);
      }
      current = current.getCause();
    }
    return null;
  }

  private static final class LimitedOutputWriter extends Writer {

    private final long maxSize;
    private final StringBuilder buffer = new StringBuilder();
    private long currentSize;

    // Initializes the in-memory writer with the configured maximum byte size.
    private LimitedOutputWriter(long maxSize) {
      this.maxSize = maxSize;
    }

    // Converts character-buffer writes into string writes so size checks stay centralized.
    @Override
    public void write(char[] cbuf, int off, int len) throws IOException {
      write(new String(cbuf, off, len));
    }

    // Appends output only while the accumulated UTF-8 size remains within the limit.
    @Override
    public void write(String str) throws IOException {
      long nextSize = currentSize + str.getBytes(StandardCharsets.UTF_8).length;
      if (nextSize > maxSize) {
        throw new OutputLimitExceededIOException(nextSize, maxSize);
      }

      buffer.append(str);
      currentSize = nextSize;
    }

    // Leaves flush as a no-op because all output is buffered in memory.
    @Override
    public void flush() {
      // No-op because output is buffered in memory.
    }

    // Leaves close as a no-op because the writer does not hold external resources.
    @Override
    public void close() {
      // No-op because there is no external resource to close.
    }

    // Returns the buffered transformation output as a string.
    @Override
    public String toString() {
      return buffer.toString();
    }
  }

  private static final class OutputLimitExceededIOException extends IOException {

    private final long actualSize;
    private final long maxSize;

    // Captures the actual and allowed output sizes when the writer exceeds its limit.
    private OutputLimitExceededIOException(long actualSize, long maxSize) {
      super("Transformation output exceeds the configured limit");
      this.actualSize = actualSize;
      this.maxSize = maxSize;
    }

    // Returns the byte size that triggered the output limit failure.
    private long getActualSize() {
      return actualSize;
    }

    // Returns the maximum byte size allowed for the transformation output.
    private long getMaxSize() {
      return maxSize;
    }
  }
}

