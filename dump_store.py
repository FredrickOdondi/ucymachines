from api.store import LeadStore
import json

def dump_leads():
    print("Dumping LeadStore...")
    leads = LeadStore.get_leads()
    print(f"Total Leads: {len(leads)}")
    if leads:
        print(json.dumps(leads[0], indent=2))
        if len(leads) > 1:
            print("...")
    else:
        print("No leads.")

if __name__ == "__main__":
    dump_leads()
