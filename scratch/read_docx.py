import zipfile
import re

def read_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read("word/document.xml").decode("utf-8")
            # Strip XML tags, adding spacing for readability
            xml_content = re.sub(r"</w:p>", "\n", xml_content)
            text = re.sub(r"<[^>]+>", "", xml_content)
            # Clean up entities
            text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
            return text
    except Exception as e:
        return f"Error reading docx: {e}"

text_content = read_docx("c:\\Users\\abhir\\Downloads\\INTROSPECT\\introspect-app\\journaling mistake detection.docx")
with open("extracted_mistake_doc.txt", "w", encoding="utf-8") as f:
    f.write(text_content)
print("Done writing to extracted_mistake_doc.txt")
