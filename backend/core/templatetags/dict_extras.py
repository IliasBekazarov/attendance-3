from django import template

register = template.Library()

@register.filter
def lookup(dictionary, key):
    """Dictionary боюнча key менен value алуу"""
    if isinstance(dictionary, dict):
        return dictionary.get(key)
    return None

@register.filter  
def get_item(dictionary, key):
    """Dictionary боюнча item алуу"""
    return dictionary.get(key)