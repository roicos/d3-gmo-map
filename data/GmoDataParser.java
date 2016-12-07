import java.net.URL;
import java.lang.Exception;
import java.io.*;
import java.lang.StringBuilder;
import java.util.regex.Matcher;  
import java.util.regex.Pattern; 
import java.util.List;
import java.util.ArrayList;
import java.nio.charset.StandardCharsets;
import javax.xml.parsers.*;
import org.w3c.dom.*;

class GMODataParser {
	
	class EventRow{
		
		public int id; // EventID
		public String crop;
		public List <String> geneSource;
		public List <String> gmTrait;
		public String developer;
		public List <Approval> approvals;
		
		@Override
			public String toString(){
				return "Crop: " + crop + ", geneSource: " + geneSource + ", gmTrait: " + gmTrait + ", developer: " + developer + " approvals: " + approvals;
			}
		
		class Approval {
			public String country;
			public int food;
			public int feed;
			public int cultivation;
			
			@Override
			public String toString(){
				return "Country: " + country + ", food: " + food + ", feed: " + feed + ", cultivation: " + cultivation;
			}
		}		
	}
	
    public static void main(String[] args) {
		GMODataParser gmoDataParser = new GMODataParser();
        try {
			URL urlMain = new URL("http://www.isaaa.org/gmapprovaldatabase/advsearch/default.asp?CropID=Any&TraitTypeID=Any&DeveloperID=Any&CountryID=Any&ApprovalTypeID=Any");
		
			String dataStringMain = getStringDataForUrl(urlMain);
			// get all EventID
			Pattern pattern = Pattern.compile("/gmapprovaldatabase/event/default.asp\\?EventID=(\\d+)");
        	Matcher matcher = pattern.matcher(dataStringMain);
			List<String> allMatches = new ArrayList<String>();			
			while (matcher.find()) {
   				allMatches.add(matcher.group(1));
 			}			
			
			List<EventRow> eventRowList = new ArrayList<EventRow>();
			
			int counter = 1;
			for(String id : allMatches){
				URL urlDetail = new URL("http://www.isaaa.org/gmapprovaldatabase/event/default.asp?EventID="+id);	
				String dataStringDetail = getStringDataForUrl(urlDetail);
				EventRow eventRow = gmoDataParser.new EventRow();
				eventRow.id = Integer.parseInt(id);
				eventRow.crop = gmoDataParser.getCrop(dataStringDetail);
				eventRow.developer = gmoDataParser.getDeveloper(dataStringDetail);
				eventRow.gmTrait = gmoDataParser.getGMTrait(dataStringDetail);
				eventRow.geneSource = gmoDataParser.getGeneSource(dataStringDetail);
				gmoDataParser.getApprovals(dataStringDetail, eventRow);
				eventRowList.add(eventRow);
				System.out.println("-"+ counter + " - ok" );
				System.out.println(eventRow);
				counter++;
			}
			
				
			// tsv
			// repeat EventID, crop, geneSource, gmTrait, developer for each country in approvals, add food, feed and cultivation fields
			gmoDataParser.writeDataToTSV(eventRowList, "data.tsv");
										
		} catch(Exception e) {
			e.printStackTrace();
		}
	}
	
	public static String getStringDataForUrl(URL url) {
		String completedString = null;
		try {
			BufferedReader reader = new BufferedReader(new 		InputStreamReader(url.openStream(), "UTF-8"));		

			StringBuilder builder = new StringBuilder();

			for (String line; (line = reader.readLine()) != null;) {				
				builder.append(line);
			}
			completedString = builder.toString();
			
		} catch(Exception e) {
			e.printStackTrace();
		}
		return completedString;
	}
	
	public static void writeDataToFile(String data, String filename){
		try	{
			File file = new File(filename);			
			if (!file.exists()) {
				file.createNewFile();
			}			
			FileOutputStream fop = new FileOutputStream(file);
			BufferedWriter out = new BufferedWriter(new OutputStreamWriter(
			fop, "UTF-8"));

			InputStream stream = new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8));

			BufferedReader reader = new BufferedReader(new InputStreamReader(stream, "UTF-8"));

			for (String line; (line = reader.readLine()) != null;) {				
				out.append(line);
			}
			out.flush();
			out.close();	
		} catch (Exception e){
			e.printStackTrace();
		}
	}
	
	public void writeDataToTSV(List<EventRow> eventRowList, String filename){
						
		try	{
			File file = new File(filename);			
			if (!file.exists()) {
				file.createNewFile();
			}				
			BufferedWriter bw = new BufferedWriter(new FileWriter(file));
			String[] headers = {"id", "crop", "geneSource", "gmTrait", "developer", "country", "food", "feed", "cultivation"};			
			bw.write(String.join("\t", headers)+"\n");
			for(EventRow er : eventRowList){
				for(EventRow.Approval a : er.approvals){
					String [] rowData = {String.valueOf(er.id), er.crop, String.join(",", er.geneSource), String.join(",", er.gmTrait), er.developer, a.country, String.valueOf(a.food), String.valueOf(a.feed), String.valueOf(a.cultivation)};
					bw.write(String.join("\t", rowData)+"\n");
				}				
			}			
			bw.close();				
		} catch (Exception e){
			e.printStackTrace();
		}
	}
	
	public String getCrop(String data){		
		Pattern pattern = Pattern.compile("<p>Crop: <a href=\"/gmapprovaldatabase/crop/default\\.asp\\?CropID=\\d+\"><em>[a-zA-Z\\s\\.]+</em> - ([a-zA-Z\\s,\\.\\(\\)]+)</a></p>");
        Matcher matcher = pattern.matcher(data);
		List<String> allMatches = new ArrayList<String>();			
		while (matcher.find()) {
			allMatches.add(matcher.group(1));
		}				
		return allMatches.get(0);
	}
	
	public String getDeveloper(String data){
		
		Pattern pattern = Pattern.compile("<p><strong>Developer:</strong><br />\\s+<a href=\"/gmapprovaldatabase/developedby/default\\.asp\\?DeveloperID=\\d+&DevelopedBy=[a-zA-Z\\s,\\.\\(\\)-/]+\">([a-zA-Z\\s,\\.\\(\\)-/]+)</a></p>");
        Matcher matcher = pattern.matcher(data);
		List<String> allMatches = new ArrayList<String>();			
		while (matcher.find()) {
			allMatches.add(matcher.group(1));
		}				
		return allMatches.get(0);
	}
	
	public List<String> getGMTrait(String data){
		
		String outer = null;
		List<String> result = new ArrayList<String>();

		Pattern pattern = Pattern.compile("<p>\\s*<strong>GM Trait\\s*s*\\s*:</strong><br /*>\\s+(.*?)</p>");
        Matcher matcher = pattern.matcher(data);
		List<String> allMatches = new ArrayList<String>();			
		while (matcher.find()) {
			allMatches.add(matcher.group(1));
		}
		if(allMatches.size() == 0){
			result.add("Not available");  // todo: find Commercial Trait
			return result;
		}
		outer = allMatches.get(0);
	
		pattern = Pattern.compile("<a href=\"/gmapprovaldatabase/gmtrait/default\\.asp\\?TraitID=\\d+&GMTrait=[a-zA-Z\\s,\\.\\(\\)-/]+\\\">([a-zA-Z\\s,\\.\\(\\)-/]+)</a>");
		matcher = pattern.matcher(outer);		
		while (matcher.find()) {
			result.add(matcher.group(1));
		}
		return result;
	}
	
	public List <String> getGeneSource(String data){
		String dataTables = getGeneticModificationsTable(data).replace("&", "&amp;");
		List <String> result = new ArrayList<String>();	
			try {	
			InputStream stream = new ByteArrayInputStream(dataTables.getBytes(StandardCharsets.UTF_8));
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder builder = factory.newDocumentBuilder();
			Document document = builder.parse(stream);
			Element root = document.getDocumentElement();
			NodeList trs = root.getElementsByTagName("tr");
			for(int i = 1; i<trs.getLength(); i++){
				Node tr = trs.item(i);
				NodeList tds = ((Element) tr).getElementsByTagName("td");
				if(((Element) tds.item(1)).getElementsByTagName("em").getLength() > 0){
					Node em = ((Element) tds.item(1)).getElementsByTagName("em").item(0);
					result.add(em.getTextContent());
				} else {
					result.add(tds.item(1).getTextContent());
				}				
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return result;		
	}
	
	public void getApprovals(String data, EventRow eventRow){
		String dataTables = getApprovalsTable(data).replace("&", "&amp;");
		eventRow.approvals = new ArrayList<EventRow.Approval>();
		
		try {	
			InputStream stream = new ByteArrayInputStream(dataTables.getBytes(StandardCharsets.UTF_8));
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder builder = factory.newDocumentBuilder();
			Document document = builder.parse(stream);
			Element root = document.getDocumentElement();
			
			NodeList trs = root.getElementsByTagName("tr");
			for(int i = 1; i<trs.getLength(); i++){
				Node tr = trs.item(i);
				
				NodeList tds = ((Element) tr).getElementsByTagName("td");
				EventRow.Approval approval = eventRow.new Approval();
				// country
				Node a = ((Element) tds.item(0)).getElementsByTagName("a").item(0);
				approval.country = a.getTextContent();
				// food
				Node spanFood = ((Element) tds.item(1)).getElementsByTagName("span").item(0);
				String spanFoodId = spanFood.getAttributes().getNamedItem("id").getNodeValue();
				approval.food = getYearById(spanFoodId, data);
				// feed
				Node spanFeed = ((Element) tds.item(2)).getElementsByTagName("span").item(0);
				String spanFeedId = spanFeed.getAttributes().getNamedItem("id").getNodeValue();
				approval.feed = getYearById(spanFeedId, data);
				// cultivation
				Node spanCultivation = ((Element) tds.item(3)).getElementsByTagName("span").item(0);
				String spanCultivationId = spanCultivation.getAttributes().getNamedItem("id").getNodeValue();
				approval.cultivation = getYearById(spanCultivationId, data);
				eventRow.approvals.add(approval);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	private Integer getYearById(String id, String data){
		Integer year = 0;
		
		Pattern pattern = Pattern.compile("<script>\\s*document\\.getElementById\\(\""+id+"\"\\)\\.innerHTML = \"(\\d{4})\\s*\\*??\";\\s*</script>");
        Matcher matcher = pattern.matcher(data);
		List<String> allMatches = new ArrayList<String>();			
		while (matcher.find()) {
			allMatches.add(matcher.group(1));
		}
		if(allMatches.size()>0){
			year =  Integer.parseInt(allMatches.get(0));
		}		
		return year;
	}
	
	private String getGeneticModificationsTable(String data){
		Pattern pattern = Pattern.compile("<p><strong>Summary of Basic Genetic Modification</strong>\\s*</p>\\s*(<table.*?</table>)");
        Matcher matcher = pattern.matcher(data);
		List<String> allMatches = new ArrayList<String>();			
		while (matcher.find()) {
			allMatches.add(matcher.group(1));
		}				
		return allMatches.get(0);
	}
	
	private String getApprovalsTable(String data){
		Pattern pattern = Pattern.compile("<p><strong>Summary of Regulatory Approvals: Country, Year and Type of Approval</strong>\\s*</p>\\s*(<table.*?</table>)");
        Matcher matcher = pattern.matcher(data);
		List<String> allMatches = new ArrayList<String>();			
		while (matcher.find()) {
			allMatches.add(matcher.group(1));
		}			
		return allMatches.get(0);
	}
}