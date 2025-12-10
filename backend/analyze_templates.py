#!/usr/bin/env python3
"""
🔍 Django Template Usage Analyzer
Бул скрипт колдонулбаган template файлдарды жана статикалык ресурстарды табат

Колдонуу:
    python analyze_templates.py
"""

import os
import re
from pathlib import Path
from collections import defaultdict
import json

class TemplateAnalyzer:
    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.templates_dir = self.base_dir / 'templates'
        self.static_dir = self.base_dir / 'static'
        self.core_dir = self.base_dir / 'core'
        
        # Натыйжалар
        self.results = {
            'templates': {},
            'static_files': {},
            'unused': [],
            'duplicates': [],
            'summary': {}
        }
        
    def find_all_templates(self):
        """Бардык template файлдарды табуу"""
        templates = []
        for root, dirs, files in os.walk(self.templates_dir):
            for file in files:
                if file.endswith('.html'):
                    rel_path = os.path.relpath(os.path.join(root, file), self.templates_dir)
                    templates.append(rel_path)
        return templates
    
    def find_template_usage_in_views(self, template_name):
        """Template views.py'да колдонулабы текшерүү"""
        usage_count = 0
        locations = []
        
        # views.py, schedule_views.py ж.б. текшерүү
        for root, dirs, files in os.walk(self.core_dir):
            for file in files:
                if file.endswith('.py') and 'view' in file:
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # render(request, 'template.html') форматын издөө
                        if template_name in content or template_name.replace('/', '\\') in content:
                            usage_count += 1
                            locations.append(f"{file}")
        
        return usage_count, locations
    
    def find_template_usage_in_templates(self, template_name):
        """Башка template'лерде колдонулабы (include, extends)"""
        usage_count = 0
        locations = []
        
        for root, dirs, files in os.walk(self.templates_dir):
            for file in files:
                if file.endswith('.html'):
                    filepath = os.path.join(root, file)
                    rel_path = os.path.relpath(filepath, self.templates_dir)
                    
                    # Өзүн текшербөө
                    if rel_path == template_name:
                        continue
                    
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # {% include 'template.html' %} же {% extends 'template.html' %}
                        patterns = [
                            rf"{{% include ['\"].*{re.escape(template_name)}.*['\"] %}}",
                            rf"{{% extends ['\"].*{re.escape(template_name)}.*['\"] %}}",
                        ]
                        
                        for pattern in patterns:
                            if re.search(pattern, content):
                                usage_count += 1
                                locations.append(f"{rel_path}")
                                break
        
        return usage_count, locations
    
    def check_static_files(self, template_path):
        """Template колдонгон статикалык файлдарды табуу"""
        static_files = {
            'css': [],
            'js': [],
            'images': []
        }
        
        try:
            with open(self.templates_dir / template_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # CSS файлдарды табуу
                css_pattern = r"{%\s*static\s+['\"]css/([^'\"]+)['\"]%}"
                static_files['css'] = re.findall(css_pattern, content)
                
                # JS файлдарды табуу
                js_pattern = r"{%\s*static\s+['\"]js/([^'\"]+)['\"]%}"
                static_files['js'] = re.findall(js_pattern, content)
                
                # Сүрөттөрдү табуу
                img_pattern = r"{%\s*static\s+['\"](?:img|images)/([^'\"]+)['\"]%}"
                static_files['images'] = re.findall(img_pattern, content)
                
        except Exception as e:
            print(f"⚠️  Ката окууда {template_path}: {e}")
        
        return static_files
    
    def find_potential_duplicates(self):
        """Потенциалдуу дубликат template'лерди табуу"""
        duplicates = []
        templates = self.find_all_templates()
        
        # Окшош аттарды издөө
        name_groups = defaultdict(list)
        for template in templates:
            base_name = os.path.basename(template).replace('modern_', '').replace('_new', '')
            name_groups[base_name].append(template)
        
        # Бир нече версиялары бар файлдар
        for base_name, versions in name_groups.items():
            if len(versions) > 1:
                duplicates.append({
                    'base_name': base_name,
                    'versions': versions,
                    'count': len(versions)
                })
        
        return duplicates
    
    def analyze(self):
        """Толук анализди башкаруу"""
        print("🔍 Template Analyzer башталды...\n")
        
        templates = self.find_all_templates()
        print(f"📄 Жалпы табылган templates: {len(templates)}\n")
        
        # Ар бир template үчүн
        for i, template in enumerate(templates, 1):
            print(f"[{i}/{len(templates)}] Анализдөө: {template}")
            
            # Views'терде колдонуу
            views_count, views_locations = self.find_template_usage_in_views(template)
            
            # Башка templates'терде колдонуу
            template_count, template_locations = self.find_template_usage_in_templates(template)
            
            # Статикалык файлдар
            static_files = self.check_static_files(template)
            
            # Жалпы колдонуу
            total_usage = views_count + template_count
            
            # Натыйжаларга кошуу
            self.results['templates'][template] = {
                'views_usage': views_count,
                'views_locations': views_locations,
                'template_usage': template_count,
                'template_locations': template_locations,
                'total_usage': total_usage,
                'static_files': static_files,
                'status': 'USED' if total_usage > 0 else 'UNUSED'
            }
            
            # Колдонулбаган файлдар
            if total_usage == 0:
                self.results['unused'].append(template)
        
        # Дубликаттарды табуу
        self.results['duplicates'] = self.find_potential_duplicates()
        
        # Жыйынтык
        used_count = sum(1 for t in self.results['templates'].values() if t['status'] == 'USED')
        unused_count = len(self.results['unused'])
        
        self.results['summary'] = {
            'total_templates': len(templates),
            'used_templates': used_count,
            'unused_templates': unused_count,
            'duplicate_groups': len(self.results['duplicates'])
        }
        
        return self.results
    
    def print_report(self):
        """Отчётту экранга чыгаруу"""
        print("\n" + "="*70)
        print("📊 АНАЛИЗ НАТЫЙЖАЛАРЫ")
        print("="*70 + "\n")
        
        # Жыйынтык
        summary = self.results['summary']
        print(f"📄 Жалпы templates: {summary['total_templates']}")
        print(f"✅ Колдонулуп жаткан: {summary['used_templates']}")
        print(f"❌ Колдонулбаган: {summary['unused_templates']}")
        print(f"🔄 Дубликат группалары: {summary['duplicate_groups']}\n")
        
        # Колдонулбаган файлдар
        if self.results['unused']:
            print("="*70)
            print("❌ КОЛДОНУЛБАГАН TEMPLATES:")
            print("="*70)
            for template in sorted(self.results['unused']):
                print(f"  • {template}")
            print()
        
        # Дубликаттар
        if self.results['duplicates']:
            print("="*70)
            print("🔄 ПОТЕНЦИАЛДУУ ДУБЛИКАТТАР:")
            print("="*70)
            for dup in self.results['duplicates']:
                print(f"\n  📋 {dup['base_name']} ({dup['count']} версия):")
                for version in dup['versions']:
                    usage = self.results['templates'][version]['total_usage']
                    status = "✅ USED" if usage > 0 else "❌ UNUSED"
                    print(f"     • {version} - {status} ({usage} refs)")
            print()
        
        # Детальдуу маалымат (эң кенен колдонулгандар)
        print("="*70)
        print("🔝 ЭҢ КӨП КОЛДОНУЛГАН TEMPLATES:")
        print("="*70)
        sorted_templates = sorted(
            self.results['templates'].items(),
            key=lambda x: x[1]['total_usage'],
            reverse=True
        )[:10]
        
        for template, info in sorted_templates:
            print(f"\n  📄 {template}")
            print(f"     Views: {info['views_usage']} | Templates: {info['template_usage']} | Total: {info['total_usage']}")
            if info['views_locations']:
                print(f"     📍 {', '.join(info['views_locations'][:3])}")
        
        print("\n" + "="*70)
    
    def save_json_report(self, output_file='template_analysis.json'):
        """Натыйжаларды JSON форматта сактоо"""
        output_path = self.base_dir / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Детальдуу отчёт сакталды: {output_path}")
    
    def generate_cleanup_script(self, output_file='cleanup_commands.sh'):
        """Тазалоо скриптин генерациялоо"""
        output_path = self.base_dir / output_file
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("#!/bin/bash\n")
            f.write("# 🧹 Auto-generated cleanup script\n")
            f.write("# ⚠️  BACKUP АЛГАНДАН КИЙИН гана жүргүзүңүз!\n\n")
            
            f.write("# Колдонулбаган templates'ти өчүрүү\n")
            f.write("echo '🗑️  Колдонулбаган файлдарды өчүрүү...'\n\n")
            
            for template in sorted(self.results['unused']):
                template_path = f"backend/templates/{template}"
                f.write(f"# git rm {template_path}\n")
            
            f.write("\n# Дубликаттарды өчүрүү (тандап)\n")
            f.write("echo '🔄 Дубликаттарды текшерүү...'\n\n")
            
            for dup in self.results['duplicates']:
                f.write(f"\n# {dup['base_name']} версиялары:\n")
                for version in dup['versions']:
                    usage = self.results['templates'][version]['total_usage']
                    if usage == 0:
                        f.write(f"# git rm backend/templates/{version}  # UNUSED\n")
                    else:
                        f.write(f"# KEEP: backend/templates/{version}  # Used {usage} times\n")
            
            f.write("\n# Commit өзгөртүүлөр\n")
            f.write('# git commit -m "Clean up unused templates"\n')
        
        print(f"🔧 Cleanup скрипт генерацияланды: {output_path}")
        print(f"   Скриптти окуп, тастыктоодон кийин жүргүзүңүз!")


def main():
    """Негизги функция"""
    # Проект директориясын аныктоо
    base_dir = Path(__file__).resolve().parent
    
    print("="*70)
    print("🚀 Django Template Analyzer")
    print("="*70 + "\n")
    
    # Analyzer түзүү
    analyzer = TemplateAnalyzer(base_dir)
    
    # Анализ жүргүзүү
    analyzer.analyze()
    
    # Отчётту чыгаруу
    analyzer.print_report()
    
    # JSON отчёт
    analyzer.save_json_report()
    
    # Cleanup скрипт
    analyzer.generate_cleanup_script()
    
    print("\n✅ Анализ аяктады!\n")
    print("📋 Кийинки кадамдар:")
    print("   1. template_analysis.json файлын окуңуз")
    print("   2. cleanup_commands.sh скриптин текшериңиз")
    print("   3. Backup түзүңүз: tar -czf backup.tar.gz backend/")
    print("   4. Git branch түзүңүз: git checkout -b cleanup/templates")
    print("   5. Тандап файлдарды өчүрүңүз")
    print("   6. Тестирлөө жүргүзүңүз\n")


if __name__ == '__main__':
    main()
