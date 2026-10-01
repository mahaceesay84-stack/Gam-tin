from django.contrib import admin

from .models import ClearanceApplication, ClearanceApplicationItem, ClearanceRequirement, Document

admin.site.register(ClearanceRequirement)
admin.site.register(ClearanceApplication)
admin.site.register(ClearanceApplicationItem)
admin.site.register(Document)
