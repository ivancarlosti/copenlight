#!/usr/bin/env python3
"""Re-apply CopenLight customizations after syncing upstream Copenhagen theme."""
import json
import os
import re
from pathlib import Path

ROOT = Path(os.environ.get("GITHUB_WORKSPACE", os.getcwd()))
VERSION = os.environ.get("PRESERVED_VERSION", "1.0.0")

CUSTOM_GROUP = {
    "label": "custom_group_label",
    "variables": [
        {
            "identifier": "logout_url",
            "type": "text",
            "description": "logout_url_description",
            "label": "logout_url_label",
            "value": "",
        },
        {
            "identifier": "inject_script",
            "type": "text",
            "description": "inject_script_description",
            "label": "inject_script_label",
            "value": "",
        },
        {
            "identifier": "inject_style",
            "type": "text",
            "description": "inject_style_description",
            "label": "inject_style_label",
            "value": "",
        },
    ],
}

TRANSLATIONS = [
    ("custom_group_label", "Label for the custom settings group", "Custom"),
    ("logout_url_label", "Label for the logout URL setting", "Logout URL"),
    (
        "logout_url_description",
        "Description for the logout URL setting",
        "Custom sign-out URL. Use the placeholder {{ACTUALPAGE}} to insert the current page URL. Leave empty to use the default sign-out link.",
    ),
    ("inject_script_label", "Label for the inject script.js setting", "Inject script.js"),
    ("inject_script_description", "Description for the inject script.js setting", "Custom JavaScript to inject into every page."),
    ("inject_style_label", "Label for the inject style.css setting", "Inject style.css"),
    ("inject_style_description", "Description for the inject style.css setting", "Custom CSS to inject into every page."),
]


def update_manifest():
    path = ROOT / "manifest.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["name"] = "CopenLight"
    data["author"] = "Ivan Carlos"
    data["version"] = VERSION
    settings = [group for group in data.get("settings", []) if group.get("label") != "custom_group_label"]
    settings.append(CUSTOM_GROUP)
    data["settings"] = settings
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def update_translations():
    path = ROOT / "translations.yml"
    text = path.read_text(encoding="utf-8")
    blocks = []
    for suffix, title, value in TRANSLATIONS:
        key = "txt.help_center_copenhagen_theme." + suffix
        if key not in text:
            blocks.append(
                "  - translation:\n"
                '      key: "' + key + '"\n'
                '      title: "' + title + '"\n'
                '      screenshot: ""\n'
                '      value: "' + value + '"\n'
            )
    if blocks:
        if not text.endswith("\n"):
            text += "\n"
        text += "".join(blocks)
        path.write_text(text, encoding="utf-8")


def update_header():
    path = ROOT / "templates/header.hbs"
    text = path.read_text(encoding="utf-8")

    desktop_pattern = re.compile(r'^([ \t]*)\{\{link "sign_out" role="menuitem"\}\}[ \t]*$', re.MULTILINE)

    def desktop_repl(match):
        indent = match.group(1)
        link_indent = indent + "  "
        return (
            indent + "{{#if settings.logout_url}}\n"
            + link_indent + '{{link "sign_out" role="menuitem" class="custom-logout-link"}}\n'
            + indent + "{{else}}\n"
            + link_indent + '{{link "sign_out" role="menuitem"}}\n'
            + indent + "{{/if}}"
        )

    mobile_pattern = re.compile(r'^([ \t]*)\{\{link "sign_out"\}\}[ \t]*$', re.MULTILINE)

    def mobile_repl(match):
        indent = match.group(1)
        link_indent = indent + "  "
        return (
            indent + "{{#if settings.logout_url}}\n"
            + link_indent + '{{link "sign_out" class="custom-logout-link"}}\n'
            + indent + "{{else}}\n"
            + link_indent + '{{link "sign_out"}}\n'
            + indent + "{{/if}}"
        )

    if "custom-logout-link" not in text:
        text = desktop_pattern.sub(desktop_repl, text)
        text = mobile_pattern.sub(mobile_repl, text)

    has_custom_links = "custom-logout-link" in text
    if has_custom_links and "PLACEHOLDER" not in text:
        script = (
            "{{#if settings.logout_url}}\n"
            "  <script>\n"
            "    (function () {\n"
            '      var PLACEHOLDER = ["{", "{", "ACTUALPAGE", "}", "}"].join("");\n'
            "      var customUrl = {{json settings.logout_url}};\n"
            '      var links = document.querySelectorAll(".custom-logout-link");\n'
            "      for (var i = 0; i < links.length; i += 1) {\n"
            '        links[i].setAttribute("href", customUrl.split(PLACEHOLDER).join(window.location.href));\n'
            "      }\n"
            "    })();\n"
            "  </script>\n"
            "{{/if}}\n"
        )
        if not text.endswith("\n"):
            text += "\n"
        text += script
    elif not has_custom_links:
        print("WARNING: sign_out link patterns not found in header.hbs; logout customization skipped.")

    path.write_text(text, encoding="utf-8")


def update_document_head():
    path = ROOT / "templates/document_head.hbs"
    text = path.read_text(encoding="utf-8")
    if "inject_style" not in text:
        blocks = (
            "{{#if settings.inject_style}}\n"
            "  <style>\n"
            "    {{{settings.inject_style}}}\n"
            "  </style>\n"
            "{{/if}}\n"
            "{{#if settings.inject_script}}\n"
            "  <script>\n"
            "    {{{settings.inject_script}}}\n"
            "  </script>\n"
            "{{/if}}\n"
        )
        if not text.endswith("\n"):
            text += "\n"
        text += blocks
    path.write_text(text, encoding="utf-8")


def main():
    update_manifest()
    update_translations()
    update_header()
    update_document_head()
    print("CopenLight customizations applied.")


if __name__ == "__main__":
    main()
